import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { randomUUID } from 'node:crypto';
import { Repository } from 'typeorm';
import { AuthUser } from '../auth/jwt.strategy';
import { CustomerEntity } from '../customers/customer.entity';
import { ProjectEntity } from './project.entity';
import { ProjectPhaseEntity } from './project-phase.entity';

@Injectable()
export class ProjectsService {
  constructor(@InjectRepository(ProjectEntity) private readonly projects: Repository<ProjectEntity>, @InjectRepository(ProjectPhaseEntity) private readonly phases: Repository<ProjectPhaseEntity>, @InjectRepository(CustomerEntity) private readonly customers: Repository<CustomerEntity>) {}

  async findMine(user: AuthUser): Promise<ProjectEntity[]> {
    const customer = await this.customers.findOne({ where: { userId: user.userId } });
    return customer ? this.projects.find({ where: { customerId: customer.id }, order: { createdAt: 'DESC' } }) : [];
  }

  async findOneMine(user: AuthUser, projectId: string): Promise<ProjectEntity> {
    const customer = await this.customers.findOne({ where: { userId: user.userId } });
    const project = customer ? await this.projects.findOne({ where: { id: projectId, customerId: customer.id } }) : null;
    if (!project) throw new NotFoundException('Project not found');
    return project;
  }

  async findPhases(user: AuthUser, projectId: string): Promise<ProjectPhaseEntity[]> {
    await this.findOneMine(user, projectId);
    return this.phases.find({ where: { projectId }, order: { phaseNumber: 'ASC' } });
  }

  async createForCustomer(user: AuthUser, projectName: string, description: string): Promise<ProjectEntity> {
    const customer = await this.customers.findOne({ where: { userId: user.userId } });
    if (!customer) throw new NotFoundException('Customer profile not found');
    return this.projects.save({ id: randomUUID(), projectCode: `PRJ-${new Date().getFullYear()}-${Date.now().toString().slice(-6)}`, projectName, description, customerId: customer.id, assignedTo: null, projectType: 'other', country: null, city: null, startDate: new Date().toISOString().slice(0, 10), expectedCompletionDate: new Date(Date.now() + 90 * 86400000).toISOString().slice(0, 10), budgetTotal: 0, budgetSpent: 0, currency: 'IRR', migInvestmentPercentage: 0, profitSharingPercentage: 0, status: 'planning', documents: [], createdBy: user.userId });
  }
}
