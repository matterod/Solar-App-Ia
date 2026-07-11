import { UserModel } from './UserModel';
import { CompanyModel } from './CompanyModel';
import { CompanyInvitationModel } from './CompanyInvitationModel';
import { ProductModel } from './ProductModel';
import { StockMovementModel } from './StockMovementModel';
import { ClientModel } from './ClientModel';
import { InstallationModel } from './InstallationModel';
import { MaintenanceModel } from './MaintenanceModel';
import { ActivityModel } from './ActivityModel';
import { CostModel } from './CostModel';
import { BudgetModel, BudgetItemModel } from './BudgetModel';
import { ProblemModel, SolutionModel } from './ProblemModel';
import { PendingTaskModel } from './PendingTaskModel';
import { SupplierModel } from './SupplierModel';

// User <-> Company (N:1)
UserModel.belongsTo(CompanyModel, { foreignKey: 'companyId', as: 'company' });
CompanyModel.hasMany(UserModel, { foreignKey: 'companyId', as: 'users' });

// Company <-> CompanyInvitation (1:N)
// Company <-> CompanyInvitation (1:N)
CompanyInvitationModel.belongsTo(CompanyModel, { foreignKey: 'companyId', as: 'company' });
CompanyModel.hasMany(CompanyInvitationModel, { foreignKey: 'companyId', as: 'invitations' });

// Company <-> Product (1:N)
ProductModel.belongsTo(CompanyModel, { foreignKey: 'companyId', as: 'company' });
CompanyModel.hasMany(ProductModel, { foreignKey: 'companyId', as: 'products' });

// Product <-> StockMovement (1:N)
StockMovementModel.belongsTo(ProductModel, { foreignKey: 'productId', as: 'product' });
ProductModel.hasMany(StockMovementModel, { foreignKey: 'productId', as: 'stockMovements' });

// User <-> StockMovement (Created by)
StockMovementModel.belongsTo(UserModel, { foreignKey: 'createdBy', as: 'creator' });

// Company <-> Client (1:N)
ClientModel.belongsTo(CompanyModel, { foreignKey: 'companyId', as: 'owningCompany' });
CompanyModel.hasMany(ClientModel, { foreignKey: 'companyId', as: 'clients' });

// User <-> Client (Created by)
ClientModel.belongsTo(UserModel, { foreignKey: 'createdBy', as: 'creator' });

// Installation Relationships
InstallationModel.belongsTo(CompanyModel, { foreignKey: 'companyId', as: 'company' });
CompanyModel.hasMany(InstallationModel, { foreignKey: 'companyId', as: 'installations' });

InstallationModel.belongsTo(ClientModel, { foreignKey: 'clientId', as: 'client' });
ClientModel.hasMany(InstallationModel, { foreignKey: 'clientId', as: 'installations' });

InstallationModel.belongsTo(UserModel, { foreignKey: 'assignedTo', as: 'assignedInstaller' });
InstallationModel.belongsTo(UserModel, { foreignKey: 'createdBy', as: 'creator' });

// StockMovement <-> Installation
StockMovementModel.belongsTo(InstallationModel, { foreignKey: 'installationId', as: 'installation' });
InstallationModel.hasMany(StockMovementModel, { foreignKey: 'installationId', as: 'stockMovements' });

// Maintenance <-> Installation
MaintenanceModel.belongsTo(InstallationModel, { foreignKey: 'installationId', as: 'installation' });
InstallationModel.hasMany(MaintenanceModel, { foreignKey: 'installationId', as: 'maintenanceRecords' });

// Maintenance <-> User (Assigned To)
MaintenanceModel.belongsTo(UserModel, { foreignKey: 'assignedTo', as: 'assignedUser' });

// Activity <-> Installation
ActivityModel.belongsTo(InstallationModel, { foreignKey: 'installationId', as: 'installation' });
InstallationModel.hasMany(ActivityModel, { foreignKey: 'installationId', as: 'activities' });

// Activity <-> User
ActivityModel.belongsTo(UserModel, { foreignKey: 'userId', as: 'user' });

// Cost <-> Installation
CostModel.belongsTo(InstallationModel, { foreignKey: 'installationId', as: 'installation' });
InstallationModel.hasMany(CostModel, { foreignKey: 'installationId', as: 'costs' });

// Cost <-> User
CostModel.belongsTo(UserModel, { foreignKey: 'createdBy', as: 'creator' });

// Budget <-> Client
BudgetModel.belongsTo(ClientModel, { foreignKey: 'clientId', as: 'client' });
ClientModel.hasMany(BudgetModel, { foreignKey: 'clientId', as: 'budgets' });

// Budget <-> Installation
BudgetModel.belongsTo(InstallationModel, { foreignKey: 'installationId', as: 'installation' });
InstallationModel.hasMany(BudgetModel, { foreignKey: 'installationId', as: 'budgets' });

// Budget <-> User
BudgetModel.belongsTo(UserModel, { foreignKey: 'createdBy', as: 'creator' });

// Budget <-> BudgetItem
BudgetModel.hasMany(BudgetItemModel, { foreignKey: 'budgetId', as: 'items', onDelete: 'CASCADE' });
BudgetItemModel.belongsTo(BudgetModel, { foreignKey: 'budgetId', as: 'budget' });

// Problem <-> Solution
ProblemModel.hasMany(SolutionModel, { foreignKey: 'problemId', as: 'solutions', onDelete: 'CASCADE' });
SolutionModel.belongsTo(ProblemModel, { foreignKey: 'problemId', as: 'problem' });

// Problem <-> Company
ProblemModel.belongsTo(CompanyModel, { foreignKey: 'companyId', as: 'company' });

// PendingTask <-> Installation
PendingTaskModel.belongsTo(InstallationModel, { foreignKey: 'installationId', as: 'installation' });
InstallationModel.hasMany(PendingTaskModel, { foreignKey: 'installationId', as: 'pendingTasks' });

// PendingTask <-> User (Assigned to)
PendingTaskModel.belongsTo(UserModel, { foreignKey: 'assignedTo', as: 'assignee' });

// PendingTask <-> User (Created by)
PendingTaskModel.belongsTo(UserModel, { foreignKey: 'createdBy', as: 'creator' });

// Supplier <-> Company
SupplierModel.belongsTo(CompanyModel, { foreignKey: 'companyId', as: 'company' });
CompanyModel.hasMany(SupplierModel, { foreignKey: 'companyId', as: 'suppliers' });

export { UserModel, CompanyModel, CompanyInvitationModel, ProductModel, StockMovementModel, ClientModel, InstallationModel, MaintenanceModel, ActivityModel, CostModel, BudgetModel, BudgetItemModel, ProblemModel, SolutionModel, PendingTaskModel, SupplierModel };
