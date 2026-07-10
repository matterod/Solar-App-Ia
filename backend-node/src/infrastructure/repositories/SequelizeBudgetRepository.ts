import { Op } from 'sequelize';
import { Budget, BudgetItem } from '../../domain/entities/Budget';
import { IBudgetRepository } from '../../domain/repositories/IBudgetRepository';
import { BudgetModel, BudgetItemModel } from '../database/models/BudgetModel';
import { ClientModel } from '../database/models/ClientModel';
import { InstallationModel } from '../database/models/InstallationModel';
import { sequelize } from '../database/database.config';

export class SequelizeBudgetRepository implements IBudgetRepository {
  async create(budget: Omit<Budget, 'id' | 'createdAt' | 'updatedAt' | 'items'>, items: Omit<BudgetItem, 'id' | 'budgetId'>[]): Promise<Budget> {
    const transaction = await sequelize.transaction();
    try {
      const newBudget = await BudgetModel.create(budget as any, { transaction });
      
      if (items && items.length > 0) {
        const itemsToCreate = items.map(item => ({
          ...item,
          budgetId: newBudget.id
        }));
        await BudgetItemModel.bulkCreate(itemsToCreate as any, { transaction });
      }

      await transaction.commit();
      
      return this.findByIdAndCompany(newBudget.id, budget.companyId) as Promise<Budget>;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async findByIdAndCompany(id: string, companyId: string): Promise<Budget | null> {
    const budget = await BudgetModel.findOne({
      where: { id, companyId },
      include: [
        {
          model: BudgetItemModel,
          as: 'items',
        }
      ],
      order: [
        [{ model: BudgetItemModel, as: 'items' }, 'sortOrder', 'ASC']
      ]
    });
    return budget ? budget.toJSON() as Budget : null;
  }

  async update(id: string, companyId: string, data: Partial<Omit<Budget, 'id' | 'companyId' | 'createdAt' | 'updatedAt' | 'items'>>, items?: Omit<BudgetItem, 'id' | 'budgetId'>[]): Promise<Budget | null> {
    const transaction = await sequelize.transaction();
    try {
      const [updatedRows] = await BudgetModel.update(data, {
        where: { id, companyId },
        transaction
      });

      if (updatedRows === 0) {
        await transaction.rollback();
        return null;
      }

      if (items !== undefined) {
        // Full replace strategy
        await BudgetItemModel.destroy({
          where: { budgetId: id },
          transaction
        });

        if (items.length > 0) {
          const itemsToCreate = items.map(item => ({
            ...item,
            budgetId: id
          }));
          await BudgetItemModel.bulkCreate(itemsToCreate as any, { transaction });
        }
      }

      await transaction.commit();
      return this.findByIdAndCompany(id, companyId);
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async delete(id: string, companyId: string): Promise<boolean> {
    const deletedRows = await BudgetModel.destroy({
      where: { id, companyId },
    });
    return deletedRows > 0;
  }

  async list(companyId: string, filters: any, skip: number, limit: number): Promise<any[]> {
    const whereClause: any = { companyId };
    
    if (filters.status) {
      whereClause.status = filters.status;
    }
    if (filters.clientId) {
      whereClause.clientId = filters.clientId;
    }
    if (filters.installationId) {
      whereClause.installationId = filters.installationId;
    }
    if (filters.search) {
      whereClause[Op.or] = [
        { title: { [Op.iLike]: `%${filters.search}%` } },
        { budgetNumber: { [Op.iLike]: `%${filters.search}%` } }
      ];
    }

    const budgets = await BudgetModel.findAll({
      where: whereClause,
      include: [
        { model: ClientModel, as: 'client', attributes: ['name'] },
        { model: InstallationModel, as: 'installation', attributes: ['locationName'] }
      ],
      limit,
      offset: skip,
      order: [['createdAt', 'DESC']],
    });

    // Format output to match Python schema (returning client_name and installation_name inline)
    return budgets.map((b: any) => {
      const json = b.toJSON();
      return {
        ...json,
        clientName: json.client?.name || null,
        installationName: json.installation?.locationName || null,
        client: undefined,
        installation: undefined
      };
    });
  }

  async generateBudgetNumber(companyId: string): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `PRES-${year}-`;
    
    const count = await BudgetModel.count({
      where: {
        companyId,
        budgetNumber: {
          [Op.like]: `${prefix}%`
        }
      }
    });
    
    const nextNumber = count + 1;
    const formattedNumber = nextNumber.toString().padStart(3, '0');
    return `${prefix}${formattedNumber}`;
  }
}
