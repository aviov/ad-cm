import { Request, Response, NextFunction } from 'express';
import { ValidationChain, validationResult } from 'express-validator';
import { HttpException } from './error.middleware';

// Helper to transform validation errors into a more usable format
const formatValidationErrors = (errors: any) => {
  const formattedErrors: Record<string, string[]> = {};
  
  errors.array().forEach((error: any) => {
    // Get the parameter name (field name)
    const param = error.path || error.param;
    
    if (!formattedErrors[param]) {
      formattedErrors[param] = [];
    }
    
    formattedErrors[param].push(error.msg);
  });
  
  return formattedErrors;
};

// Middleware that runs after express-validator chains and throws exception if validation fails
export const validate = (validations: ValidationChain[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Run all validations
    await Promise.all(validations.map(validation => validation.run(req)));
    
    const errors = validationResult(req);
    
    if (errors.isEmpty()) {
      return next();
    }
    
    const formattedErrors = formatValidationErrors(errors);
    
    // Throw a 400 Bad Request with the validation errors
    next(new HttpException(400, 'Validation error', formattedErrors));
  };
};

// Specific validation for IDs in route parameters
export const validateId = (paramName: string = 'id') => {
  return (req: Request, res: Response, next: NextFunction) => {
    const id = parseInt(req.params[paramName]);
    
    if (isNaN(id) || id <= 0) {
      next(new HttpException(400, `Invalid ${paramName} parameter`));
      return;
    }
    
    next();
  };
};