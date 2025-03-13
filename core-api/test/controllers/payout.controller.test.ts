import { Request, Response } from 'express';
import { PayoutController } from '../../src/controllers/payout.controller';
import { PayoutService } from '../../src/services/payout.service';
import { Payout } from '../../src/entities/Payout';
import { Campaign } from '../../src/entities/Campaign';
import { Country } from '../../src/entities/Country';
import { mockPayoutData, mockCampaignData } from '../utils/test-helpers';

// Mock dependencies
jest.mock('../../src/services/payout.service');
jest.mock('express-validator', () => ({
  validationResult: jest.fn()
}));

describe('PayoutController', () => {
  let payoutController: PayoutController;
  let mockPayoutService: jest.Mocked<PayoutService>;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let jsonSpy: jest.Mock;
  let statusSpy: jest.Mock;
  let endSpy: jest.Mock;

  // Prepare test data
  const mockCountry: Country = {
    id: 2,
    name: 'Test Country',
    code: 'TC',
    payouts: [] // Add this property required by the Country type
  };

  const mockCampaign: Campaign = {
    id: 1,
    title: 'Test Campaign',
    landingPageUrl: 'https://example.com',
    isRunning: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    payouts: []
  };

  const createMockPayout = (overrides = {}): Payout => ({
    id: 1,
    amount: 1.5,
    budget: 100,
    autoStop: false,
    budgetAlert: false,
    budgetAlertEmail: '',
    createdAt: new Date(),
    updatedAt: new Date(),
    countryId: 2,
    campaign: mockCampaign,
    country: mockCountry,
    ...overrides
  });

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Mock response methods
    jsonSpy = jest.fn();
    statusSpy = jest.fn().mockReturnThis();
    endSpy = jest.fn();
    
    mockResponse = {
      json: jsonSpy,
      status: statusSpy,
      end: endSpy,
    };
    
    // Mock validation result
    const validationResultMock = require('express-validator').validationResult;
    validationResultMock.mockImplementation(() => ({
      isEmpty: jest.fn().mockReturnValue(true),
      array: jest.fn().mockReturnValue([]),
    }));
    
    // Initialize controller (will use mocked service)
    payoutController = new PayoutController();
    
    // Get reference to mocked service instance
    mockPayoutService = (PayoutService as jest.MockedClass<typeof PayoutService>).prototype as jest.Mocked<PayoutService>;
  });

  describe('getPayoutsByCampaignId', () => {
    beforeEach(() => {
      mockRequest = {
        params: { campaignId: '1' },
      };
    });

    it('should return payouts for a campaign', async () => {
      // Arrange
      const mockPayouts: Payout[] = [
        createMockPayout({ id: 1 }),
        createMockPayout({ id: 2, amount: 2.5 })
      ];
      mockPayoutService.getPayoutsByCampaignId.mockResolvedValue(mockPayouts);

      // Act
      await payoutController.getPayoutsByCampaignId(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockPayoutService.getPayoutsByCampaignId).toHaveBeenCalledWith(1);
      expect(jsonSpy).toHaveBeenCalledWith(mockPayouts);
    });

    it('should handle errors', async () => {
      // Arrange
      const error = new Error('Database error');
      mockPayoutService.getPayoutsByCampaignId.mockRejectedValue(error);

      // Act
      await payoutController.getPayoutsByCampaignId(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(statusSpy).toHaveBeenCalledWith(500);
      expect(jsonSpy).toHaveBeenCalledWith({ message: 'Failed to fetch payouts' });
    });
  });

  describe('createPayout', () => {
    beforeEach(() => {
      mockRequest = {
        params: { campaignId: '1' },
        body: {
          countryId: 2,
          amount: 1.5,
          status: 'active'
        },
      };
    });

    it('should create a payout with valid data', async () => {
      // Arrange
      const mockPayout = createMockPayout();
      mockPayoutService.createPayout.mockResolvedValue(mockPayout as Payout);

      // Act
      await payoutController.createPayout(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockPayoutService.createPayout).toHaveBeenCalledWith(
        1,
        2,
        { amount: 1.5, status: 'active' }
      );
      expect(statusSpy).toHaveBeenCalledWith(201);
      expect(jsonSpy).toHaveBeenCalledWith(mockPayout);
    });

    it('should return 400 with validation errors', async () => {
      // Arrange
      const validationErrors = [{ msg: 'Amount is required' }];
      const validationResultMock = require('express-validator').validationResult;
      validationResultMock.mockImplementationOnce(() => ({
        isEmpty: jest.fn().mockReturnValue(false),
        array: jest.fn().mockReturnValue(validationErrors),
      }));

      // Act
      await payoutController.createPayout(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockPayoutService.createPayout).not.toHaveBeenCalled();
      expect(statusSpy).toHaveBeenCalledWith(400);
      expect(jsonSpy).toHaveBeenCalledWith({ errors: validationErrors });
    });

    it('should return 404 when campaign or country not found', async () => {
      // Arrange
      mockPayoutService.createPayout.mockResolvedValue(null);

      // Act
      await payoutController.createPayout(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(statusSpy).toHaveBeenCalledWith(404);
      expect(jsonSpy).toHaveBeenCalledWith({ 
        message: "Campaign or country not found, or payout already exists for this country" 
      });
    });

    it('should handle errors', async () => {
      // Arrange
      const error = new Error('Database error');
      mockPayoutService.createPayout.mockRejectedValue(error);

      // Act
      await payoutController.createPayout(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(statusSpy).toHaveBeenCalledWith(500);
      expect(jsonSpy).toHaveBeenCalledWith({ message: 'Failed to create payout' });
    });
  });
  
  describe('updatePayout', () => {
    beforeEach(() => {
      mockRequest = {
        params: { id: '1' },
        body: {
          amount: 2.0,
        },
      };
    });

    it('should update a payout with valid data', async () => {
      // Arrange
      const mockPayout = createMockPayout({ amount: 2.0 });
      mockPayoutService.updatePayout.mockResolvedValue(mockPayout as Payout);

      // Act
      await payoutController.updatePayout(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockPayoutService.updatePayout).toHaveBeenCalledWith(1, mockRequest.body);
      expect(jsonSpy).toHaveBeenCalledWith(mockPayout);
    });

    it('should return 404 when payout not found', async () => {
      // Arrange
      mockPayoutService.updatePayout.mockResolvedValue(null);

      // Act
      await payoutController.updatePayout(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(statusSpy).toHaveBeenCalledWith(404);
      expect(jsonSpy).toHaveBeenCalledWith({ message: 'Payout not found' });
    });
  });

  describe('deletePayout', () => {
    beforeEach(() => {
      mockRequest = {
        params: { id: '1' },
      };
    });

    it('should delete a payout when it exists', async () => {
      // Arrange
      mockPayoutService.deletePayout.mockResolvedValue(true);

      // Act
      await payoutController.deletePayout(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockPayoutService.deletePayout).toHaveBeenCalledWith(1);
      expect(statusSpy).toHaveBeenCalledWith(204);
      expect(endSpy).toHaveBeenCalled();
    });

    it('should return 404 when payout does not exist', async () => {
      // Arrange
      mockPayoutService.deletePayout.mockResolvedValue(false);

      // Act
      await payoutController.deletePayout(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(statusSpy).toHaveBeenCalledWith(404);
      expect(jsonSpy).toHaveBeenCalledWith({ message: 'Payout not found' });
    });
  });
});
