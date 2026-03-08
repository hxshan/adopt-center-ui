import { z } from 'zod';

// Pet form validation schema
export const petSchema = z.object({
  name: z.string()
    .min(1, 'Name is required')
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must be less than 100 characters'),

  species: z.enum(['Dog', 'Cat'], {
    errorMap: () => ({ message: 'Please select a species' })
  }),

  breed: z.string()
    .min(1, 'Breed is required'),

  age: z.string()
    .min(1, 'Age is required')
    .regex(/^\d+$/, 'Age must be a number'),

  gender: z.enum(['Male', 'Female'], {
    errorMap: () => ({ message: 'Please select a gender' })
  }),

  size: z.enum(['Small', 'Medium', 'Large', 'Extra Large'], {
    errorMap: () => ({ message: 'Please select a size' })
  }),

  weight: z.string()
    .optional()
    .refine((val) => !val || val === '' || /^\d+(\.\d+)?$/.test(val), {
      message: 'Weight must be a valid number'
    }),

  color: z.enum(['Black', 'Brown', 'Golden', 'Yellow', 'Cream', 'Gray', 'White'], {
    errorMap: () => ({ message: 'Please select a color' }),
  }),

  adoptionFee: z.string()
    .regex(/^\d+(\.\d+)?$/, 'Adoption fee must be a valid number'),

  description: z.string()
    .min(10, 'Description must be at least 10 characters')
    .max(1000, 'Description must be less than 1000 characters'),

  specialNeeds: z.string().optional(),

  energyLevel: z.enum(['Low', 'Moderate', 'High', 'Very High'], {
    errorMap: () => ({ message: 'Please select energy level' })
  }),

  adoptionStatus: z.enum(['Available', 'Pending', 'Adopted', 'On Hold', 'Medical Care'], {
    errorMap: () => ({ message: 'Please select adoption status' })
  }).optional(),

  // Boolean fields
  goodWithKids: z.boolean(),
  goodWithPets: z.boolean(),
  vaccinated: z.boolean(),
  neutered: z.boolean(),
  houseTrained: z.boolean(),
});

// Helper function to validate and get errors
export const validatePetForm = (data) => {
  try {
    petSchema.parse(data);
    return { success: true, errors: {} };
  } catch (error) {
    if (error instanceof z.ZodError && error.issues && Array.isArray(error.issues)) {
      const errors = {};
      error.issues.forEach((err) => {
        if (err.path && err.path[0]) {
          errors[err.path[0]] = err.message;
        }
      });
      return { success: false, errors };
    }
    return { success: false, errors: { general: 'Validation failed' } };
  }
};

// Adoption application form validation schema
export const adoptionApplicationSchema = z.object({
  livingType: z.string()
    .min(1, 'Please select your living situation')
    .refine(
      (val) => ['Apartment', 'House', 'Condo', 'Farm', 'Other'].includes(val),
      { message: 'Please select a valid living situation' }
    ),

  hasChildren: z.boolean({
    required_error: 'Please specify if you have children',
    invalid_type_error: 'Please specify if you have children',
  }),

  childrenAges: z.array(z.number()).optional(),

  hasOtherPets: z.boolean({
    required_error: 'Please specify if you have other pets',
    invalid_type_error: 'Please specify if you have other pets',
  }),

  otherPetsDetails: z.string().optional(),

  activityLevel: z.string()
    .min(1, 'Please select your activity level')
    .refine(
      (val) => ['Low', 'Moderate', 'High', 'Very High'].includes(val),
      { message: 'Please select a valid activity level' }
    ),

  experienceLevel: z.string()
    .min(1, 'Please select your experience level')
    .refine(
      (val) => ['First-time', 'Experienced', 'Expert'].includes(val),
      { message: 'Please select a valid experience level' }
    ),

  workSchedule: z.string()
    .min(1, 'Please select your work schedule')
    .refine(
      (val) => ['Full-time', 'Part-time', 'Remote', 'Retired', 'Student'].includes(val),
      { message: 'Please select a valid work schedule' }
    ),

  reasonForAdoption: z
    .string()
    .min(20, 'Please write at least 20 characters explaining why you want to adopt')
    .max(2000, 'Reason must be less than 2000 characters'),

  additionalNotes: z
    .string()
    .max(1000, 'Notes must be less than 1000 characters')
    .optional(),
});

// Helper function to validate adoption form
export const validateAdoptionForm = (data) => {
  try {
    adoptionApplicationSchema.parse(data);
    return { success: true, errors: {} };
  } catch (error) {
    if (error instanceof z.ZodError && error.issues && Array.isArray(error.issues)) {
      const errors = {};
      error.issues.forEach((err) => {
        if (err.path && err.path[0]) {
          errors[err.path[0]] = err.message;
        }
      });
      return { success: false, errors };
    }
    return { success: false, errors: { general: 'Validation failed' } };
  }
};
