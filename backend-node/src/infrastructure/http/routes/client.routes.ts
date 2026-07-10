import { Router } from 'express';
import { ClientController } from '../controllers/ClientController';
import { getCurrentUser } from '../middlewares/auth.middleware';
import { SequelizeClientRepository } from '../../repositories/SequelizeClientRepository';
import { CreateClientUseCase, GetClientUseCase, UpdateClientUseCase, DeleteClientUseCase, ListClientsUseCase } from '../../../application/use-cases/ClientUseCases';

const router = Router();

// DI Setup
const clientRepo = new SequelizeClientRepository();
const createClientUseCase = new CreateClientUseCase(clientRepo);
const getClientUseCase = new GetClientUseCase(clientRepo);
const updateClientUseCase = new UpdateClientUseCase(clientRepo);
const deleteClientUseCase = new DeleteClientUseCase(clientRepo);
const listClientsUseCase = new ListClientsUseCase(clientRepo);
const clientController = new ClientController(
  createClientUseCase,
  getClientUseCase,
  updateClientUseCase,
  deleteClientUseCase,
  listClientsUseCase
);

router.use(getCurrentUser); // Require auth for all client routes

router.get('/', (req, res) => clientController.listClients(req, res));
router.get('/:id', (req, res) => clientController.getClient(req, res));
router.post('/', (req, res) => clientController.createClient(req, res));
router.put('/:id', (req, res) => clientController.updateClient(req, res));
router.delete('/:id', (req, res) => clientController.deleteClient(req, res));

export default router;
