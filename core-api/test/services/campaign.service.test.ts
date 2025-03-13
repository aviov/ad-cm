import { createMockRepository, mockCampaignData, MockAppDataSource, resetMockRepositories } from '../utils/test-helpers';

// Import service and entities
import { CampaignService } from '../../src/services/campaign.service';
import { Campaign } from '../../src/entities/Campaign';
import { Repository } from 'typeorm';

// Mock the AppDataSource
jest.mock('../../src/database/data-source', () => ({
  AppDataSource: MockAppDataSource
}));

describe('CampaignService', () => {
  let campaignService: CampaignService;
  let mockCampaignRepository: jest.Mocked<Repository<Campaign>>;

  beforeEach(() => {
    // Reset mock repositories
    resetMockRepositories();
    
    // Create mocked repository with proper typing
    mockCampaignRepository = createMockRepository<Campaign>() as jest.Mocked<Repository<Campaign>>;
    
    // Set the mock repository to be returned by the MockAppDataSource
    MockAppDataSource.getRepository.mockReturnValue(mockCampaignRepository);
    
    // Initialize the service
    campaignService = new CampaignService();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getAllCampaigns', () => {
    it('should return all campaigns when no filters are provided', async () => {
      // Arrange
      const mockCampaigns = [...mockCampaignData];
      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(mockCampaigns),
      };
      
      mockCampaignRepository.createQueryBuilder = jest.fn().mockReturnValue(mockQueryBuilder as any);

      // Act
      const result = await campaignService.getAllCampaigns();

      // Assert
      expect(mockCampaignRepository.createQueryBuilder).toHaveBeenCalledWith('campaign');
      expect(mockQueryBuilder.leftJoinAndSelect).toHaveBeenCalledTimes(2);
      expect(mockQueryBuilder.getMany).toHaveBeenCalled();
      expect(result).toEqual(mockCampaigns);
    });

    it('should filter campaigns by search term', async () => {
      // Arrange
      const searchTerm = 'test';
      const mockCampaigns = [...mockCampaignData];
      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue([mockCampaigns[0]]),
      };
      
      mockCampaignRepository.createQueryBuilder = jest.fn().mockReturnValue(mockQueryBuilder as any);

      // Act
      const result = await campaignService.getAllCampaigns(searchTerm);

      // Assert
      expect(mockCampaignRepository.createQueryBuilder).toHaveBeenCalledWith('campaign');
      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        expect.stringContaining('ILIKE :search'),
        { search: `%${searchTerm}%` }
      );
      expect(mockQueryBuilder.getMany).toHaveBeenCalled();
      expect(result).toEqual([mockCampaigns[0]]);
    });

    it('should filter campaigns by running status', async () => {
      // Arrange
      const isRunning = true;
      const mockCampaigns = [...mockCampaignData].filter(c => c.isRunning === isRunning);
      const mockQueryBuilder = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(mockCampaigns),
      };
      
      mockCampaignRepository.createQueryBuilder = jest.fn().mockReturnValue(mockQueryBuilder as any);

      // Act
      const result = await campaignService.getAllCampaigns(undefined, isRunning);

      // Assert
      expect(mockCampaignRepository.createQueryBuilder).toHaveBeenCalledWith('campaign');
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        expect.stringContaining('isRunning'),
        { isRunning }
      );
      expect(mockQueryBuilder.getMany).toHaveBeenCalled();
      expect(result).toEqual(mockCampaigns);
    });
  });

  describe('getCampaignById', () => {
    it('should return a campaign by id', async () => {
      // Arrange
      const campaignId = 1;
      const mockCampaign = mockCampaignData[0];
      
      mockCampaignRepository.findOne = jest.fn().mockResolvedValue(mockCampaign);

      // Act
      const result = await campaignService.getCampaignById(campaignId);

      // Assert
      expect(mockCampaignRepository.findOne).toHaveBeenCalledWith({
        where: { id: campaignId },
        relations: ["payouts", "payouts.country"],
      });
      expect(result).toEqual(mockCampaign);
    });

    it('should return null if campaign does not exist', async () => {
      // Arrange
      const campaignId = 999;
      
      mockCampaignRepository.findOne = jest.fn().mockResolvedValue(null);

      // Act
      const result = await campaignService.getCampaignById(campaignId);

      // Assert
      expect(mockCampaignRepository.findOne).toHaveBeenCalledWith({
        where: { id: campaignId },
        relations: ["payouts", "payouts.country"],
      });
      expect(result).toBeNull();
    });
  });

  describe('createCampaign', () => {
    it('should create and return a new campaign', async () => {
      // Arrange
      const campaignData: Partial<Campaign> = {
        title: 'New Campaign',
        landingPageUrl: 'https://example.com/new',
        isRunning: true
      };
      
      const createdCampaign = { 
        ...campaignData,
        id: 3,
        createdAt: new Date(),
        updatedAt: new Date(),
        payouts: []
      } as Campaign;
      
      mockCampaignRepository.create = jest.fn().mockReturnValue(createdCampaign);
      mockCampaignRepository.save = jest.fn().mockResolvedValue(createdCampaign);

      // Act
      const result = await campaignService.createCampaign(campaignData);

      // Assert
      expect(mockCampaignRepository.create).toHaveBeenCalledWith(campaignData);
      expect(mockCampaignRepository.save).toHaveBeenCalledWith(createdCampaign);
      expect(result).toEqual(createdCampaign);
    });
  });

  describe('updateCampaign', () => {
    it('should update and return an existing campaign', async () => {
      // Arrange
      const campaignId = 1;
      const updateData: Partial<Campaign> = {
        isRunning: false
      };
      
      const existingCampaign = mockCampaignData[0];
      const updatedCampaign = { 
        ...existingCampaign,
        ...updateData
      } as Campaign;
      
      mockCampaignRepository.findOne = jest.fn().mockResolvedValue(existingCampaign);
      mockCampaignRepository.save = jest.fn().mockResolvedValue(updatedCampaign);

      // Act
      const result = await campaignService.updateCampaign(campaignId, updateData);

      // Assert
      expect(mockCampaignRepository.findOne).toHaveBeenCalledWith({
        where: { id: campaignId },
        relations: ["payouts", "payouts.country"],
      });
      expect(mockCampaignRepository.save).toHaveBeenCalledWith({
        ...existingCampaign,
        ...updateData
      });
      expect(result).toEqual(updatedCampaign);
    });

    it('should return null if campaign to update does not exist', async () => {
      // Arrange
      const campaignId = 999;
      const updateData = { isRunning: false };
      
      mockCampaignRepository.findOne = jest.fn().mockResolvedValue(null);

      // Act
      const result = await campaignService.updateCampaign(campaignId, updateData);

      // Assert
      expect(mockCampaignRepository.findOne).toHaveBeenCalledWith({
        where: { id: campaignId },
        relations: ["payouts", "payouts.country"],
      });
      expect(mockCampaignRepository.save).not.toHaveBeenCalled();
      expect(result).toBeNull();
    });
  });

  describe('deleteCampaign', () => {
    it('should delete an existing campaign and return true', async () => {
      // Arrange
      const campaignId = 1;
      const existingCampaign = mockCampaignData[0];
      
      mockCampaignRepository.findOne = jest.fn().mockResolvedValue(existingCampaign);
      mockCampaignRepository.remove = jest.fn().mockResolvedValue(existingCampaign);

      // Act
      const result = await campaignService.deleteCampaign(campaignId);

      // Assert
      expect(mockCampaignRepository.findOne).toHaveBeenCalledWith({
        where: { id: campaignId },
        relations: ["payouts", "payouts.country"],
      });
      expect(mockCampaignRepository.remove).toHaveBeenCalledWith(existingCampaign);
      expect(result).toBe(true);
    });

    it('should return false when campaign does not exist', async () => {
      // Arrange
      const campaignId = 999;
      
      mockCampaignRepository.findOne = jest.fn().mockResolvedValue(null);
      mockCampaignRepository.remove = jest.fn();

      // Act
      const result = await campaignService.deleteCampaign(campaignId);

      // Assert
      expect(mockCampaignRepository.findOne).toHaveBeenCalledWith({
        where: { id: campaignId },
        relations: ["payouts", "payouts.country"],
      });
      expect(mockCampaignRepository.remove).not.toHaveBeenCalled();
      expect(result).toBe(false);
    });
  });
});
