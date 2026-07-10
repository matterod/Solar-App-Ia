import { Router } from 'express';
import { ProblemController } from '../controllers/ProblemController';
import { getCurrentUser } from '../middlewares/auth.middleware';
import { SequelizeProblemRepository } from '../../repositories/SequelizeProblemRepository';
import { 
  CreateProblemUseCase, 
  GetProblemUseCase, 
  UpdateProblemUseCase, 
  DeleteProblemUseCase, 
  ListProblemsUseCase,
  AddSolutionUseCase
} from '../../../application/use-cases/ProblemUseCases';

const router = Router();

// DI Setup
const problemRepo = new SequelizeProblemRepository();
const createProblemUseCase = new CreateProblemUseCase(problemRepo);
const getProblemUseCase = new GetProblemUseCase(problemRepo);
const updateProblemUseCase = new UpdateProblemUseCase(problemRepo);
const deleteProblemUseCase = new DeleteProblemUseCase(problemRepo);
const listProblemsUseCase = new ListProblemsUseCase(problemRepo);
const addSolutionUseCase = new AddSolutionUseCase(problemRepo);

const problemController = new ProblemController(
  createProblemUseCase,
  getProblemUseCase,
  updateProblemUseCase,
  deleteProblemUseCase,
  listProblemsUseCase,
  addSolutionUseCase
);

router.use(getCurrentUser); // Require auth

router.get('/', (req, res) => problemController.listProblems(req, res));
router.get('/:id', (req, res) => problemController.getProblem(req, res));
router.post('/', (req, res) => problemController.createProblem(req, res));
router.put('/:id', (req, res) => problemController.updateProblem(req, res));
router.delete('/:id', (req, res) => problemController.deleteProblem(req, res));
router.post('/:id/solutions', (req, res) => problemController.addSolution(req, res));

export default router;
