/**
 * @file Tests unitarios para el servicio de reservas
 */

// Mock de la base de datos
jest.mock('../../config/database', () => ({
  db: jest.fn()
}));

const { db } = require('../../config/database');
const {
  findAllBookings,
  findBookingByUserAndClass,
  countActiveBookingsByClass,
  addBooking,
  modifyBookingStatus,
  removeBooking,
  findBooking
} = require('../booking.service');

describe('Booking Service', () => {
  let mockSelect, mockWhere, mockFirst, mockInsert, mockUpdate, mockDel, mockJoin, mockCount;

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
    mockCount = jest.fn().mockReturnThis();
  });

  describe('findAllBookings', () => {
    it('debe retornar todas las reservas sin filtros', async () => {
      const mockBookings = [
        {
          id: 1,
          user_id: 1,
          class_id: 1,
          status: 'confirmed',
          first_name: 'Juan',
          last_name: 'Pérez',
          start_time: '2026-03-01 10:00:00'
        }
      ];

      // Mock the full chain - the query is returned and then awaited
      const mockQuery = Promise.resolve(mockBookings);
      mockSelect.mockReturnValue(mockQuery);
      mockJoin.mockReturnValue({ join: mockJoin, select: mockSelect });
      db.mockReturnValue({ join: mockJoin });

      const result = await findAllBookings();

      expect(db).toHaveBeenCalledWith('bookings');
      expect(result).toEqual(mockBookings);
    });

    it('debe filtrar reservas por usuario', async () => {
      const mockBookings = [
        {
          id: 1,
          user_id: 1,
          class_id: 1,
          status: 'confirmed',
          first_name: 'Juan',
          last_name: 'Pérez',
          start_time: '2026-03-01 10:00:00'
        }
      ];

      // Create a mock query object that supports chaining
      const mockQuery = {
        where: jest.fn().mockReturnThis(),
        then: function(resolve) { resolve(mockBookings); }
      };
      mockSelect.mockReturnValue(mockQuery);
      mockJoin.mockReturnValue({ join: mockJoin, select: mockSelect });
      db.mockReturnValue({ join: mockJoin });

      const result = await findAllBookings(1);

      expect(mockQuery.where).toHaveBeenCalledWith('bookings.user_id', 1);
      expect(result).toEqual(mockBookings);
    });

    it('debe filtrar reservas por clase', async () => {
      const mockBookings = [
        {
          id: 1,
          user_id: 1,
          class_id: 5,
          status: 'confirmed',
          first_name: 'Juan',
          last_name: 'Pérez',
          start_time: '2026-03-01 10:00:00'
        }
      ];

      // Create a mock query object that supports chaining
      const mockQuery = {
        where: jest.fn().mockReturnThis(),
        then: function(resolve) { resolve(mockBookings); }
      };
      mockSelect.mockReturnValue(mockQuery);
      mockJoin.mockReturnValue({ join: mockJoin, select: mockSelect });
      db.mockReturnValue({ join: mockJoin });

      const result = await findAllBookings(null, 5);

      expect(mockQuery.where).toHaveBeenCalledWith('bookings.class_id', 5);
      expect(result).toEqual(mockBookings);
    });
  });

  describe('findBookingByUserAndClass', () => {
    it('debe encontrar una reserva específica por usuario y clase', async () => {
      const mockBooking = {
        id: 1,
        user_id: 1,
        class_id: 5,
        status: 'confirmed'
      };

      mockFirst.mockResolvedValue(mockBooking);
      mockWhere.mockReturnValue({ where: mockWhere, first: mockFirst });
      db.mockReturnValue({ where: mockWhere });

      const result = await findBookingByUserAndClass(1, 5);

      expect(db).toHaveBeenCalledWith('bookings');
      expect(result).toEqual(mockBooking);
    });

    it('debe retornar undefined si no existe la reserva', async () => {
      mockFirst.mockResolvedValue(undefined);
      mockWhere.mockReturnValue({ where: mockWhere, first: mockFirst });
      db.mockReturnValue({ where: mockWhere });

      const result = await findBookingByUserAndClass(1, 999);

      expect(result).toBeUndefined();
    });
  });

  describe('countActiveBookingsByClass', () => {
    it('debe contar las reservas activas de una clase', async () => {
      mockFirst.mockResolvedValue({ total: '15' });
      mockCount.mockReturnValue({ first: mockFirst });
      mockWhere.mockReturnValue({ where: mockWhere, count: mockCount });
      db.mockReturnValue({ where: mockWhere });

      const result = await countActiveBookingsByClass(5);

      expect(db).toHaveBeenCalledWith('bookings');
      expect(mockWhere).toHaveBeenCalledWith('class_id', 5);
      expect(mockWhere).toHaveBeenCalledWith('status', 'confirmed');
      expect(result).toBe(15);
    });

    it('debe retornar 0 si no hay reservas activas', async () => {
      mockFirst.mockResolvedValue({ total: null });
      mockCount.mockReturnValue({ first: mockFirst });
      mockWhere.mockReturnValue({ where: mockWhere, count: mockCount });
      db.mockReturnValue({ where: mockWhere });

      const result = await countActiveBookingsByClass(999);

      expect(result).toBe(0);
    });
  });

  describe('addBooking', () => {
    it('debe crear una nueva reserva', async () => {
      mockInsert.mockResolvedValue([20]);
      db.mockReturnValue({ insert: mockInsert });

      const result = await addBooking(1, 5);

      expect(db).toHaveBeenCalledWith('bookings');
      expect(mockInsert).toHaveBeenCalledWith({ user_id: 1, class_id: 5 });
      expect(result).toEqual({
        id: 20,
        user_id: 1,
        class_id: 5,
        status: 'confirmed'
      });
    });
  });

  describe('modifyBookingStatus', () => {
    it('debe actualizar el estado de una reserva', async () => {
      mockUpdate.mockResolvedValue(1);
      mockWhere.mockReturnValue({ update: mockUpdate });
      db.mockReturnValue({ where: mockWhere });

      const result = await modifyBookingStatus(1, 'cancelled');

      expect(db).toHaveBeenCalledWith('bookings');
      expect(mockWhere).toHaveBeenCalledWith('id', 1);
      expect(mockUpdate).toHaveBeenCalledWith({ status: 'cancelled' });
      expect(result).toEqual({ id: 1, status: 'cancelled' });
    });
  });

  describe('removeBooking', () => {
    it('debe eliminar una reserva', async () => {
      mockDel.mockResolvedValue(1);
      mockWhere.mockReturnValue({ del: mockDel });
      db.mockReturnValue({ where: mockWhere });

      await removeBooking(1);

      expect(db).toHaveBeenCalledWith('bookings');
      expect(mockWhere).toHaveBeenCalledWith('id', 1);
      expect(mockDel).toHaveBeenCalled();
    });
  });

  describe('findBooking', () => {
    it('debe encontrar una reserva por ID', async () => {
      const mockBooking = {
        id: 1,
        user_id: 1,
        class_id: 5,
        status: 'confirmed'
      };

      mockFirst.mockResolvedValue(mockBooking);
      mockWhere.mockReturnValue({ first: mockFirst });
      db.mockReturnValue({ where: mockWhere });

      const result = await findBooking(1);

      expect(db).toHaveBeenCalledWith('bookings');
      expect(mockWhere).toHaveBeenCalledWith('id', 1);
      expect(result).toEqual(mockBooking);
    });
  });
});
