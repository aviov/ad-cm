import { Request, Response } from 'express';
import { CampaignController } from '../../src/controllers/campaign.controller';
import { CampaignService } from '../../src/services/campaign.service';
import { Campaign } from '../../src/entities/Campaign';

// Mock dependencies
jest.mock('../../src/services/campaign.service');
jest.mock('express-validator', () => ({
  validationResult: jest.fn()
}));

describe('CampaignController', () => {
  let campaignController: CampaignController;
  let mockCampaignService: jest.Mocked<CampaignService>;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let jsonSpy: jest.Mock;
  let statusSpy: jest.Mock;
  let endSpy: jest.Mock;

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
    campaignController = new CampaignController();
    
    // Get reference to mocked service instance
    mockCampaignService = (CampaignService as jest.MockedClass<typeof CampaignService>).prototype as jest.Mocked<CampaignService>;
  });

  describe('getAllCampaigns', () => {
    beforeEach(() => {
      mockRequest = {
        query: {},
      };
    });

    it('should return campaigns when no filters are applied', async () => {
      // Arrange
      const mockCampaigns: Campaign[] = [
        { 
          id: 1, 
          title: 'Campaign 1', 
          landingPageUrl: 'http://example.com/1',
          isRunning: true,
          createdAt: new Date(),
          updatedAt: new Date(),
          payouts: []
        },
        { 
          id: 2, 
          title: 'Campaign 2', 
          landingPageUrl: 'http://example.com/2',
          isRunning: false,
          createdAt: new Date(),
          updatedAt: new Date(),
          payouts: []
        }
      ];
      mockCampaignService.getAllCampaigns.mockResolvedValue(mockCampaigns);

      // Act
      await campaignController.getAllCampaigns(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockCampaignService.getAllCampaigns).toHaveBeenCalledWith(undefined, undefined);
      expect(jsonSpy).toHaveBeenCalledWith(mockCampaigns);
    });

    it('should pass search query to service', async () => {
      // Arrange
      mockRequest.query = { search: 'test' };
      const mockCampaigns: Campaign[] = [
        { 
          id: 1, 
          title: 'Test Campaign', 
          landingPageUrl: 'http://example.com/test',
          isRunning: true,
          createdAt: new Date(),
          updatedAt: new Date(),
          payouts: []
        }
      ];
      mockCampaignService.getAllCampaigns.mockResolvedValue(mockCampaigns);

      // Act
      await campaignController.getAllCampaigns(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockCampaignService.getAllCampaigns).toHaveBeenCalledWith('test', undefined);
      expect(jsonSpy).toHaveBeenCalledWith(mockCampaigns);
    });

    it('should pass isRunning filter to service', async () => {
      // Arrange
      mockRequest.query = { isRunning: 'true' };
      const mockCampaigns: Campaign[] = [
        { 
          id: 1, 
          title: 'Running Campaign', 
          landingPageUrl: 'http://example.com/running',
          isRunning: true,
          createdAt: new Date(),
          updatedAt: new Date(),
          payouts: []
        }
      ];
      mockCampaignService.getAllCampaigns.mockResolvedValue(mockCampaigns);

      // Act
      await campaignController.getAllCampaigns(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockCampaignService.getAllCampaigns).toHaveBeenCalledWith(undefined, true);
      expect(jsonSpy).toHaveBeenCalledWith(mockCampaigns);
    });

    it('should handle errors', async () => {
      // Arrange
      const error = new Error('Database error');
      mockCampaignService.getAllCampaigns.mockRejectedValue(error);

      // Act
      await campaignController.getAllCampaigns(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(statusSpy).toHaveBeenCalledWith(500);
      expect(jsonSpy).toHaveBeenCalledWith({ message: 'Failed to fetch campaigns' });
    });
  });

  describe('getCampaignById', () => {
    beforeEach(() => {
      mockRequest = {
        params: { id: '1' },
      };
    });

    it('should return a campaign when it exists', async () => {
      // Arrange
      const mockCampaign: Campaign = { 
        id: 1, 
        title: 'Campaign 1', 
        landingPageUrl: 'http://example.com/1',
        isRunning: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        payouts: []
      };
      mockCampaignService.getCampaignById.mockResolvedValue(mockCampaign);

      // Act
      await campaignController.getCampaignById(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockCampaignService.getCampaignById).toHaveBeenCalledWith(1);
      expect(jsonSpy).toHaveBeenCalledWith(mockCampaign);
    });

    it('should return 404 when campaign does not exist', async () => {
      // Arrange
      mockCampaignService.getCampaignById.mockResolvedValue(null);

      // Act
      await campaignController.getCampaignById(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(statusSpy).toHaveBeenCalledWith(404);
      expect(jsonSpy).toHaveBeenCalledWith({ message: 'Campaign not found' });
    });

    it('should handle errors', async () => {
      // Arrange
      const error = new Error('Database error');
      mockCampaignService.getCampaignById.mockRejectedValue(error);

      // Act
      await campaignController.getCampaignById(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(statusSpy).toHaveBeenCalledWith(500);
      expect(jsonSpy).toHaveBeenCalledWith({ message: 'Failed to fetch campaign' });
    });
  });

  describe('createCampaign', () => {
    beforeEach(() => {
      mockRequest = {
        body: {
          title: 'New Campaign',
          landingPageUrl: 'http://example.com/new',
          isRunning: true
        },
      };
    });

    it('should create a campaign with valid data', async () => {
      // Arrange
      const mockCampaign: Campaign = { 
        id: 1, 
        ...mockRequest.body,
        createdAt: new Date(),
        updatedAt: new Date(),
        payouts: []
      };
      mockCampaignService.createCampaign.mockResolvedValue(mockCampaign);

      // Act
      await campaignController.createCampaign(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockCampaignService.createCampaign).toHaveBeenCalledWith(mockRequest.body as Campaign);
      expect(statusSpy).toHaveBeenCalledWith(201);
      expect(jsonSpy).toHaveBeenCalledWith(mockCampaign);
    });

    it('should return 400 with validation errors', async () => {
      // Arrange
      const validationErrors = [{ msg: 'Title is required' }];
      const validationResultMock = require('express-validator').validationResult;
      validationResultMock.mockImplementationOnce(() => ({
        isEmpty: jest.fn().mockReturnValue(false),
        array: jest.fn().mockReturnValue(validationErrors),
      }));

      // Act
      await campaignController.createCampaign(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockCampaignService.createCampaign).not.toHaveBeenCalled();
      expect(statusSpy).toHaveBeenCalledWith(400);
      expect(jsonSpy).toHaveBeenCalledWith({ errors: validationErrors });
    });

    it('should handle errors', async () => {
      // Arrange
      const error = new Error('Database error');
      mockCampaignService.createCampaign.mockRejectedValue(error);

      // Act
      await campaignController.createCampaign(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(statusSpy).toHaveBeenCalledWith(500);
      expect(jsonSpy).toHaveBeenCalledWith({ message: 'Failed to create campaign' });
    });
  });

  describe('updateCampaign', () => {
    beforeEach(() => {
      mockRequest = {
        params: { id: '1' },
        body: {
          title: 'Updated Campaign',
          isRunning: false
        },
      };
    });

    it('should update a campaign with valid data', async () => {
      // Arrange
      const mockCampaign: Campaign = { 
        id: 1, 
        title: 'Updated Campaign',
        landingPageUrl: 'http://example.com/1',
        isRunning: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        payouts: []
      };
      mockCampaignService.updateCampaign.mockResolvedValue(mockCampaign);

      // Act
      await campaignController.updateCampaign(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockCampaignService.updateCampaign).toHaveBeenCalledWith(1, mockRequest.body as Campaign);
      expect(jsonSpy).toHaveBeenCalledWith(mockCampaign);
    });

    it('should return 404 when campaign not found', async () => {
      // Arrange
      mockCampaignService.updateCampaign.mockResolvedValue(null);

      // Act
      await campaignController.updateCampaign(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(statusSpy).toHaveBeenCalledWith(404);
      expect(jsonSpy).toHaveBeenCalledWith({ message: 'Campaign not found' });
    });

    it('should handle errors', async () => {
      // Arrange
      const error = new Error('Database error');
      mockCampaignService.updateCampaign.mockRejectedValue(error);

      // Act
      await campaignController.updateCampaign(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(statusSpy).toHaveBeenCalledWith(500);
      expect(jsonSpy).toHaveBeenCalledWith({ message: 'Failed to update campaign' });
    });
  });

  describe('deleteCampaign', () => {
    beforeEach(() => {
      mockRequest = {
        params: { id: '1' },
      };
    });

    it('should delete a campaign when it exists', async () => {
      // Arrange
      mockCampaignService.deleteCampaign.mockResolvedValue(true);

      // Act
      await campaignController.deleteCampaign(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(mockCampaignService.deleteCampaign).toHaveBeenCalledWith(1);
      expect(statusSpy).toHaveBeenCalledWith(204);
      expect(endSpy).toHaveBeenCalled();
    });

    it('should return 404 when campaign does not exist', async () => {
      // Arrange
      mockCampaignService.deleteCampaign.mockResolvedValue(false);

      // Act
      await campaignController.deleteCampaign(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(statusSpy).toHaveBeenCalledWith(404);
      expect(jsonSpy).toHaveBeenCalledWith({ message: 'Campaign not found' });
    });

    it('should handle errors', async () => {
      // Arrange
      const error = new Error('Database error');
      mockCampaignService.deleteCampaign.mockRejectedValue(error);

      // Act
      await campaignController.deleteCampaign(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(statusSpy).toHaveBeenCalledWith(500);
      expect(jsonSpy).toHaveBeenCalledWith({ message: 'Failed to delete campaign' });
    });
  });
});
