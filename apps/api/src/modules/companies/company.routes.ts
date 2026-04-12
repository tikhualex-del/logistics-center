import { Router } from 'express';
import { validate, validateParams } from '../../middlewares/validate.middleware';
import {
  validateIdParam,
  validateCreateCompanyInput,
  validateUpdateCompanyInput,
  validateChangeCompanyStatusInput,
} from './company.validation';
import {
  getCompanies,
  getCompanyById,
  createCompany,
  updateCompany,
  changeCompanyStatus,
  archiveCompany,
} from './company.controller';

const router = Router();

router.get('/', getCompanies);
router.post('/', validate(validateCreateCompanyInput), createCompany);
router.get('/:id', validateParams(validateIdParam), getCompanyById);
router.patch('/:id/status', validateParams(validateIdParam), validate(validateChangeCompanyStatusInput), changeCompanyStatus);
router.patch('/:id/archive', validateParams(validateIdParam), archiveCompany);
router.patch('/:id', validateParams(validateIdParam), validate(validateUpdateCompanyInput), updateCompany);

export default router;
