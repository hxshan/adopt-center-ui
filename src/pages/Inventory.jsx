import React, { useState } from 'react';
import { MoreHorizontal, Eye, Edit, Trash2, Plus, Download, RefreshCw, X } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { toast } from 'sonner';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { getImageUrl, cn } from '../lib/utils';
import PageActions from '../components/common/PageActions';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../components/ui/dropdown-menu";
import FilterBar from '../components/common/FilterBar';

// ── Status options ────────────────────────────────────────────────────────────
const ADOPTION_STATUSES = ['Available', 'Pending', 'On Hold', 'Medical Care', 'Adopted'];

const getStatusVariant = (status) => {
  switch (status) {
    case 'Available':    return 'success';
    case 'Adopted':      return 'secondary';
    case 'Pending':      return 'warning';
    case 'On Hold':      return 'default';
    case 'Medical Care': return 'destructive';
    default:             return 'default';
  }
};

// ── Inline Status Change Modal ────────────────────────────────────────────────
const StatusModal = ({ pet, onClose, onConfirm }) => {
  const [selected, setSelected] = useState(pet.adoptionStatus || 'Available');
  const [saving, setSaving] = useState(false);

  const handleConfirm = async () => {
    if (selected === pet.adoptionStatus) { onClose(); return; }
    setSaving(true);
    try {
      await onConfirm(pet._id, selected);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div
        className="bg-white rounded-xl shadow-xl w-full max-w-sm mx-4 p-5"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">Change Status</h3>
            <p className="text-xs text-slate-400 mt-0.5">{pet.name}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Status Options */}
        <div className="flex flex-col gap-2 mb-5">
          {ADOPTION_STATUSES.map((status) => (
            <button
              key={status}
              type="button"
              onClick={() => setSelected(status)}
              className={cn(
                'flex items-center justify-between px-3 py-2.5 rounded-lg border text-sm text-left transition-all',
                selected === status
                  ? 'border-pink-400 bg-pink-50 text-pink-700 font-medium'
                  : 'border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50'
              )}
            >
              <span>{status}</span>
              {selected === status && (
                <svg className="w-4 h-4 text-pink-500" viewBox="0 0 12 12" fill="none">
                  <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </button>
          ))}
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <button
            onClick={handleConfirm}
            disabled={saving}
            className="flex-1 py-2 bg-pink-600 text-white text-sm font-medium rounded-md hover:bg-pink-700 disabled:opacity-50 transition-colors"
          >
            {saving ? 'Saving...' : 'Save Status'}
          </button>
          <button
            onClick={onClose}
            className="flex-1 py-2 bg-slate-100 text-slate-600 text-sm font-medium rounded-md hover:bg-slate-200 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Main Component ─────────────────────────────────────────────────────────────
const Inventory = () => {
  const { pets, deletePet, updatePetStatus, navigate } = useAppContext();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [speciesFilter, setSpeciesFilter] = useState('all');
  const [genderFilter, setGenderFilter] = useState('all');
  const [sizeFilter, setSizeFilter] = useState('all');

  // Status change modal state
  const [statusModalPet, setStatusModalPet] = useState(null);

  // Filter Logic
  const filteredPets = pets.filter(pet => {
    const matchesSearch = pet.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pet.breed.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || pet.adoptionStatus === statusFilter;
    const matchesSpecies = speciesFilter === 'all' || pet.species === speciesFilter;
    const matchesGender = genderFilter === 'all' || pet.gender === genderFilter;
    const matchesSize = sizeFilter === 'all' || pet.size === sizeFilter;

    return matchesSearch && matchesStatus && matchesSpecies && matchesGender && matchesSize;
  });

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete ${name}?\n\nThis action cannot be undone.`)) return;
    try {
      await deletePet(id);
    } catch (err) {
      // Error toast is already shown by AppContext
    }
  };

  const handleStatusChange = async (petId, newStatus) => {
    await updatePetStatus(petId, newStatus);
  };

  const handleExportCSV = () => {
    const headers = ['Name', 'Species', 'Breed', 'Status', 'Gender', 'Age', 'Adoption Fee'];
    const rows = pets.map((p) => [p.name, p.species, p.breed, p.adoptionStatus, p.gender, p.age, p.adoptionFee]);
    const csv = 'data:text/csv;charset=utf-8,' + headers.join(',') + '\n' + rows.map((r) => r.join(',')).join('\n');
    const link = document.createElement('a');
    link.setAttribute('href', encodeURI(csv));
    link.setAttribute('download', 'pet_inventory.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const actionItems = [
    { label: 'Add Pet', icon: Plus, onClick: () => navigate('add-pet') },
    { separator: true },
    { label: 'Export CSV', icon: Download, onClick: handleExportCSV },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Pet Inventory</h1>
          <p className="text-slate-500 mt-1">Manage and track all pets in the shelter.</p>
        </div>
        <PageActions items={actionItems} />
      </div>

      <FilterBar
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        statusFilter={statusFilter}
        onStatusChange={setStatusFilter}
        speciesFilter={speciesFilter}
        onSpeciesChange={setSpeciesFilter}
        genderFilter={genderFilter}
        onGenderChange={setGenderFilter}
        sizeFilter={sizeFilter}
        onSizeChange={setSizeFilter}
        onClearFilters={() => {
          setSearchTerm('');
          setStatusFilter('all');
          setSpeciesFilter('all');
          setGenderFilter('all');
          setSizeFilter('all');
        }}
      />

      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50/50 hover:bg-slate-50/50">
              <TableHead className="w-[250px]">Pet</TableHead>
              <TableHead>Species</TableHead>
              <TableHead>Breed</TableHead>
              <TableHead>Age</TableHead>
              <TableHead>Gender</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredPets.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center">
                  No pets found matching your criteria.
                </TableCell>
              </TableRow>
            ) : (
              filteredPets.map((pet) => (
                <TableRow key={pet._id} className="hover:bg-slate-50 cursor-pointer" onClick={() => navigate('pet-detail', pet._id)}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10 border border-slate-200">
                        <AvatarImage src={getImageUrl(pet.photos?.[0])} alt={pet.name} className="object-cover" />
                        <AvatarFallback>{pet.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-semibold text-slate-900">{pet.name}</p>
                        <p className="text-xs text-slate-500">ID: {pet._id.substring(0, 8)}...</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{pet.species}</TableCell>
                  <TableCell>{pet.breed}</TableCell>
                  <TableCell>{pet.age} yrs</TableCell>
                  <TableCell>{pet.gender}</TableCell>
                  <TableCell>
                    <Badge variant={getStatusVariant(pet.adoptionStatus)}>
                      {pet.adoptionStatus}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Open menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); navigate('pet-detail', pet._id); }}>
                          <Eye className="mr-2 h-4 w-4" /> View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); navigate('edit-pet', pet._id); }}>
                          <Edit className="mr-2 h-4 w-4" /> Edit Pet
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={(e) => { e.stopPropagation(); setStatusModalPet(pet); }}
                        >
                          <RefreshCw className="mr-2 h-4 w-4" /> Change Status
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-red-600 focus:text-red-600"
                          onClick={(e) => { e.stopPropagation(); handleDelete(pet._id, pet.name); }}
                        >
                          <Trash2 className="mr-2 h-4 w-4" /> Delete Pet
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="mt-4 text-sm text-gray-500">
        Showing {filteredPets.length} of {pets.length} pets
      </div>

      {/* Status Change Modal */}
      {statusModalPet && (
        <StatusModal
          pet={statusModalPet}
          onClose={() => setStatusModalPet(null)}
          onConfirm={handleStatusChange}
        />
      )}
    </div>
  );
};

export default Inventory;
