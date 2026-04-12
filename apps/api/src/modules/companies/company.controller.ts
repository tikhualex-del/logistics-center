import { Request, Response } from 'express';
import * as companyService from './company.service';

export async function getCompanies(_req: Request, res: Response): Promise<void> {
  const data = await companyService.getAll();
  res.json({ success: true, data });
}

export async function getCompanyById(req: Request<{ id: string }>, res: Response): Promise<void> {
  const data = await companyService.getById(req.params.id);
  res.json({ success: true, data });
}

export async function createCompany(req: Request, res: Response): Promise<void> {
  const data = await companyService.create(req.body);
  res.status(201).json({ success: true, data });
}

export async function updateCompany(req: Request<{ id: string }>, res: Response): Promise<void> {
  const data = await companyService.update(req.params.id, req.body);
  res.json({ success: true, data });
}

export async function changeCompanyStatus(req: Request<{ id: string }>, res: Response): Promise<void> {
  const data = await companyService.changeStatus(req.params.id, req.body);
  res.json({ success: true, data });
}

export async function archiveCompany(req: Request<{ id: string }>, res: Response): Promise<void> {
  const data = await companyService.archive(req.params.id);
  res.json({ success: true, data });
}
