/**
 * @file Tests unitarios para el servicio de clases
 */

// Mock de la base de datos
jest.mock('../../config/database', () => ({
  db: jest.fn()
}));

const { db } = require('../../config/database');
const {
  findAllClasses,
  classExistsById,
  findClassByInstructorAndTime,
  addClass,
  modifyClass,
  removeClass
} = require('../class.service');

describe('Class Service', () => {
  let mockSelect, mockWhere, mockFirst, mockInsert, mockUpdate, mockDel, mockJoin;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup mock chain
    mockSelect = jest.fn().mockReturnThis();
    mockWhere = jest.fn().mockReturnThis();
    mockFirst = jest.fn();
    mockInsert = jest.fn();
    mockUpdate = jest.fn();
    mockDel = jest.fn();
    mockJoin = jest.fn().mockReturnThis();
  });

  describe('findAllClasses', () => {
    it('debe retornar todas las clases sin filtros', async () => {
      const mockClasses = [
        {
          id: 1,
          modality_id: 1,
          instructor_id: 1,
          start_time: '2026-03-01 10:00:00',
          end_time: '2026-03-01 11:00:00',
          capacity: 20,
          modality_name: 'Spinning'
        }
      ];

      // Mock the full chain - the query is returned and then awaited by the controller
      const mockQuery = Promise.resolve(mockClasses);
      mockSelect.mockReturnValue(mockQuery);
      mockJoin.mockReturnValue({ select: mockSelect });
      db.mockReturnValue({ join: mockJoin });

      const result = await findAllClasses();

      expect(db).toHaveBeenCalledWith('classes');
      expect(mockJoin).toHaveBeenCalledWith('modalities', 'classes.modality_id', 'modalities.id');
      expect(result).toEqual(mockClasses);
    });

    it('debe filtrar clases por modalidad', async () => {
      const mockClasses = [
        {
          id: 1,
          modality_id: 1,
          instructor_id: 1,
          start_time: '2026-03-01 10:00:00',
          end_time: '2026-03-01 11:00:00',
          capacity: 20,
          modality_name: 'Spinning'
        }
      ];

      // Create a mock query object that supports chaining and resolves to data  
      const mockQuery = {
        where: jest.fn().mockReturnThis(),
        then: function(resolve) { resolve(mockClasses); }
      };
      mockSelect.mockReturnValue(mockQuery);
      mockJoin.mockReturnValue({ select: mockSelect });
      db.mockReturnValue({ join: mockJoin });

      const result = await findAllClasses(1);

      expect(mockQuery.where).toHaveBeenCalledWith('classes.modality_id', 1);
      expect(result).toEqual(mockClasses);
    });

    it('debe filtrar clases por búsqueda de texto', async () => {
      const mockClasses = [
        {
          id: 1,
          modality_id: 1,
          instructor_id: 1,
          start_time: '2026-03-01 10:00:00',
          end_time: '2026-03-01 11:00:00',
          capacity: 20,
          modality_name: 'Spinning'
        }
      ];

      // Create a mock query object that supports chaining
      const mockQuery = {
        where: jest.fn().mockReturnThis(),
        then: function(resolve) { resolve(mockClasses); }
      };
      mockSelect.mockReturnValue(mockQuery);
      mockJoin.mockReturnValue({ select: mockSelect });
      db.mockReturnValue({ join: mockJoin });

      const result = await findAllClasses(null, 'Spin');

      expect(mockQuery.where).toHaveBeenCalledWith('modalities.title', 'like', '%Spin%');
      expect(result).toEqual(mockClasses);
    });
  });

  describe('classExistsById', () => {
    it('debe retornar true si la clase existe', async () => {
      const mockClass = { id: 1, modality_id: 1, instructor_id: 1 };

      mockFirst.mockResolvedValue(mockClass);
      mockWhere.mockReturnValue({ first: mockFirst });
      db.mockReturnValue({ where: mockWhere });

      const result = await classExistsById(1);

      expect(db).toHaveBeenCalledWith('classes');
      expect(mockWhere).toHaveBeenCalledWith('id', 1);
      expect(result).toBe(true);
    });

    it('debe retornar false si la clase no existe', async () => {
      mockFirst.mockResolvedValue(undefined);
      mockWhere.mockReturnValue({ first: mockFirst });
      db.mockReturnValue({ where: mockWhere });

      const result = await classExistsById(999);

      expect(result).toBe(false);
    });
  });

  describe('findClassByInstructorAndTime', () => {
    it('debe encontrar conflicto de horario del instructor', async () => {
      const mockClass = {
        id: 1,
        instructor_id: 5,
        start_time: '2026-03-01 10:00:00'
      };

      mockFirst.mockResolvedValue(mockClass);
      mockWhere.mockReturnValue({ where: mockWhere, first: mockFirst });
      db.mockReturnValue({ where: mockWhere });

      const result = await findClassByInstructorAndTime(5, '2026-03-01 10:00:00');

      expect(db).toHaveBeenCalledWith('classes');
      expect(result).toEqual(mockClass);
    });

    it('debe retornar undefined si no hay conflicto', async () => {
      mockFirst.mockResolvedValue(undefined);
      mockWhere.mockReturnValue({ where: mockWhere, first: mockFirst });
      db.mockReturnValue({ where: mockWhere });

      const result = await findClassByInstructorAndTime(5, '2026-03-01 14:00:00');

      expect(result).toBeUndefined();
    });
  });

  describe('addClass', () => {
    it('debe crear una nueva clase', async () => {
      const newClass = {
        modality_id: 1,
        instructor_id: 5,
        start_time: '2026-03-01 10:00:00',
        end_time: '2026-03-01 11:00:00',
        capacity: 20
      };

      mockInsert.mockResolvedValue([10]);
      db.mockReturnValue({ insert: mockInsert });

      const result = await addClass(
        newClass.modality_id,
        newClass.instructor_id,
        newClass.start_time,
        newClass.end_time,
        newClass.capacity
      );

      expect(db).toHaveBeenCalledWith('classes');
      expect(mockInsert).toHaveBeenCalledWith({
        modality_id: newClass.modality_id,
        instructor_id: newClass.instructor_id,
        start_time: newClass.start_time,
        end_time: newClass.end_time,
        capacity: newClass.capacity
      });
      expect(result).toEqual({ id: 10, ...newClass });
    });
  });

  describe('modifyClass', () => {
    it('debe actualizar una clase existente', async () => {
      const updatedClass = {
        id: 1,
        modality_id: 1,
        instructor_id: 5,
        start_time: '2026-03-01 15:00:00',
        end_time: '2026-03-01 16:00:00',
        capacity: 25
      };

      mockUpdate.mockResolvedValue(1);
      mockWhere.mockReturnValue({ update: mockUpdate });
      db.mockReturnValue({ where: mockWhere });

      const result = await modifyClass(
        updatedClass.id,
        updatedClass.modality_id,
        updatedClass.instructor_id,
        updatedClass.start_time,
        updatedClass.end_time,
        updatedClass.capacity
      );

      expect(db).toHaveBeenCalledWith('classes');
      expect(mockWhere).toHaveBeenCalledWith('id', updatedClass.id);
      expect(result).toEqual(updatedClass);
    });
  });

  describe('removeClass', () => {
    it('debe eliminar una clase', async () => {
      mockDel.mockResolvedValue(1);
      mockWhere.mockReturnValue({ del: mockDel });
      db.mockReturnValue({ where: mockWhere });

      await removeClass(1);

      expect(db).toHaveBeenCalledWith('classes');
      expect(mockWhere).toHaveBeenCalledWith('id', 1);
      expect(mockDel).toHaveBeenCalled();
    });
  });
});
