import { createMockRepository, mockCampaignData, mockPayoutData, MockAppDataSource, resetMockRepositories } from '../utils/test-helpers';

// Mock the AppDataSource
jest.mock('../../src/database/data-source', () => ({
  AppDataSource: MockAppDataSource
}));

// Mock the IntegrationService
jest.mock('../../src/services/integration.service');

// Import service and entities after mocks are set up
import { PayoutService } from '../../src/services/payout.service';
import { Payout } from '../../src/entities/Payout';
import { Campaign } from '../../src/entities/Campaign';
import { Country } from '../../src/entities/Country';
import { Repository } from 'typeorm';
import { IntegrationService } from '../../src/services/integration.service';

describe('PayoutService', () => {
  let payoutService: PayoutService;
  let mockPayoutRepository: jest.Mocked<Repository<Payout>>;
  let mockCampaignRepository: jest.Mocked<Repository<Campaign>>;
  let mockCountryRepository: jest.Mocked<Repository<Country>>;
  let mockIntegrationService: jest.Mocked<IntegrationService>;

  beforeEach(() => {
    // Reset mock repositories
    resetMockRepositories();
    
    // Create mocked repositories with proper typing
    mockPayoutRepository = createMockRepository<Payout>() as jest.Mocked<Repository<Payout>>;
    mockCampaignRepository = createMockRepository<Campaign>() as jest.Mocked<Repository<Campaign>>;
    mockCountryRepository = createMockRepository<Country>() as jest.Mocked<Repository<Country>>;
    
    // Set up the mock repositories to be returned by the MockAppDataSource
    MockAppDataSource.getRepository.mockImplementation((entity) => {
      if (entity === Payout) return mockPayoutRepository;
      if (entity === Campaign) return mockCampaignRepository;
      if (entity === Country) return mockCountryRepository;
      return createMockRepository() as jest.Mocked<Repository<any>>;
    });
    
    // Set up the mock IntegrationService
    mockIntegrationService = {
      notifyPayoutCreated: jest.fn(),
      notifyPayoutUpdated: jest.fn(),
      notifyPayoutDeleted: jest.fn()
    } as unknown as jest.Mocked<IntegrationService>;
    
    (IntegrationService as jest.Mock).mockImplementation(() => mockIntegrationService);
    
    // Initialize the service
    payoutService = new PayoutService();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getPayoutsByCampaignId', () => {
    it('should return payouts for a specific campaign', async () => {
      // Arrange
      const campaignId = 1;
      const campaignPayouts = mockPayoutData.filter(p => p.campaign.id === campaignId);
      
      mockPayoutRepository.find = jest.fn().mockResolvedValue(campaignPayouts);

      // Act
      const result = await payoutService.getPayoutsByCampaignId(campaignId);

      // Assert
      expect(mockPayoutRepository.find).toHaveBeenCalledWith({
        where: { campaign: { id: campaignId } },
        relations: ["country"],
      });
      expect(result).toEqual(campaignPayouts);
    });
  });

  describe('createPayout', () => {
    it('should create a new payout and return it', async () => {
      // Arrange
      const campaignId = 1;
      const countryId = 1;
      const payoutData = {
        amount: 2.5,
        budget: 200,
        autoStop: true
      };
      
      const campaign = mockCampaignData[0];
      const country = { id: countryId, name: 'United States', code: 'US', payouts: [] };
      const newPayout = {
        id: 3,
        ...payoutData,
        campaign,
        country,
        createdAt: new Date(),
        updatedAt: new Date(),
        budgetAlert: false,
        budgetAlertEmail: '',
        countryId: countryId
      } as unknown as Payout;
      
      mockCampaignRepository.findOneBy = jest.fn().mockResolvedValue(campaign);
      mockCountryRepository.findOneBy = jest.fn().mockResolvedValue(country);
      mockPayoutRepository.findOne = jest.fn().mockResolvedValue(null); // No existing payout
      mockPayoutRepository.create = jest.fn().mockReturnValue(newPayout);
      mockPayoutRepository.save = jest.fn().mockResolvedValue(newPayout);

      // Act
      const result = await payoutService.createPayout(campaignId, countryId, payoutData);

      // Assert
      expect(mockCampaignRepository.findOneBy).toHaveBeenCalledWith({ id: campaignId });
      expect(mockCountryRepository.findOneBy).toHaveBeenCalledWith({ id: countryId });
      expect(mockPayoutRepository.findOne).toHaveBeenCalledWith({
        where: {
          campaign: { id: campaignId },
          country: { id: countryId },
        },
      });
      expect(mockPayoutRepository.create).toHaveBeenCalledWith({
        ...payoutData,
        campaign,
        country,
      });
      expect(mockPayoutRepository.save).toHaveBeenCalledWith(newPayout);
      expect(mockIntegrationService.notifyPayoutCreated).toHaveBeenCalledWith(newPayout);
      expect(result).toEqual(newPayout);
    });

    it('should return null when campaign does not exist', async () => {
      // Arrange
      const campaignId = 999;
      const countryId = 1;
      const payoutData = { amount: 2.5 };
      
      mockCampaignRepository.findOneBy = jest.fn().mockResolvedValue(null);
      mockCountryRepository.findOneBy = jest.fn().mockResolvedValue({ id: 1 });

      // Act
      const result = await payoutService.createPayout(campaignId, countryId, payoutData);

      // Assert
      expect(mockCampaignRepository.findOneBy).toHaveBeenCalledWith({ id: campaignId });
      expect(mockPayoutRepository.create).not.toHaveBeenCalled();
      expect(mockPayoutRepository.save).not.toHaveBeenCalled();
      expect(mockIntegrationService.notifyPayoutCreated).not.toHaveBeenCalled();
      expect(result).toBeNull();
    });

    it('should return null when country does not exist', async () => {
      // Arrange
      const campaignId = 1;
      const countryId = 999;
      const payoutData = { amount: 2.5 };
      
      mockCampaignRepository.findOneBy = jest.fn().mockResolvedValue(mockCampaignData[0]);
      mockCountryRepository.findOneBy = jest.fn().mockResolvedValue(null);

      // Act
      const result = await payoutService.createPayout(campaignId, countryId, payoutData);

      // Assert
      expect(mockCampaignRepository.findOneBy).toHaveBeenCalledWith({ id: campaignId });
      expect(mockCountryRepository.findOneBy).toHaveBeenCalledWith({ id: countryId });
      expect(mockPayoutRepository.create).not.toHaveBeenCalled();
      expect(mockPayoutRepository.save).not.toHaveBeenCalled();
      expect(mockIntegrationService.notifyPayoutCreated).not.toHaveBeenCalled();
      expect(result).toBeNull();
    });

    it('should return null when payout already exists for campaign and country', async () => {
      // Arrange
      const campaignId = 1;
      const countryId = 1;
      const payoutData = { amount: 2.5 };
      
      const existingPayout = mockPayoutData[0];
      
      mockCampaignRepository.findOneBy = jest.fn().mockResolvedValue(mockCampaignData[0]);
      mockCountryRepository.findOneBy = jest.fn().mockResolvedValue({ id: countryId, name: 'United States', code: 'US' });
      mockPayoutRepository.findOne = jest.fn().mockResolvedValue(existingPayout);

      // Act
      const result = await payoutService.createPayout(campaignId, countryId, payoutData);

      // Assert
      expect(mockCampaignRepository.findOneBy).toHaveBeenCalledWith({ id: campaignId });
      expect(mockCountryRepository.findOneBy).toHaveBeenCalledWith({ id: countryId });
      expect(mockPayoutRepository.findOne).toHaveBeenCalledWith({
        where: {
          campaign: { id: campaignId },
          country: { id: countryId },
        },
      });
      expect(mockPayoutRepository.create).not.toHaveBeenCalled();
      expect(mockPayoutRepository.save).not.toHaveBeenCalled();
      expect(mockIntegrationService.notifyPayoutCreated).not.toHaveBeenCalled();
      expect(result).toBeNull();
    });
  });

  describe('updatePayout', () => {
    it('should update an existing payout and return it', async () => {
      // Arrange
      const payoutId = 1;
      const payoutData = { amount: 3.0 };
      
      const existingPayout = { ...mockPayoutData[0] };
      const updatedPayout = { 
        ...existingPayout,
        ...payoutData
      } as Payout;
      
      mockPayoutRepository.findOne = jest.fn().mockResolvedValue(existingPayout);
      mockPayoutRepository.save = jest.fn().mockResolvedValue(updatedPayout);

      // Act
      const result = await payoutService.updatePayout(payoutId, payoutData);

      // Assert
      expect(mockPayoutRepository.findOne).toHaveBeenCalledWith({
        where: { id: payoutId },
        relations: ["campaign", "country"],
      });
      expect(mockPayoutRepository.save).toHaveBeenCalled();
      expect(mockIntegrationService.notifyPayoutUpdated).toHaveBeenCalledWith(updatedPayout);
      expect(result).toEqual(updatedPayout);
    });

    it('should return null when payout does not exist', async () => {
      // Arrange
      const payoutId = 999;
      const payoutData = { amount: 3.0 };
      
      mockPayoutRepository.findOne = jest.fn().mockResolvedValue(null);

      // Act
      const result = await payoutService.updatePayout(payoutId, payoutData);

      // Assert
      expect(mockPayoutRepository.findOne).toHaveBeenCalledWith({
        where: { id: payoutId },
        relations: ["campaign", "country"],
      });
      expect(mockPayoutRepository.save).not.toHaveBeenCalled();
      expect(mockIntegrationService.notifyPayoutUpdated).not.toHaveBeenCalled();
      expect(result).toBeNull();
    });
  });

  describe('deletePayout', () => {
    it('should delete an existing payout and return true', async () => {
      // Arrange
      const payoutId = 1;
      const existingPayout = { ...mockPayoutData[0] };
      
      mockPayoutRepository.findOne = jest.fn().mockResolvedValue(existingPayout);
      mockPayoutRepository.remove = jest.fn().mockResolvedValue(existingPayout);

      // Act
      const result = await payoutService.deletePayout(payoutId);

      // Assert
      expect(mockPayoutRepository.findOne).toHaveBeenCalledWith({
        where: { id: payoutId },
        relations: ["campaign"],
      });
      expect(mockPayoutRepository.remove).toHaveBeenCalledWith(existingPayout);
      expect(mockIntegrationService.notifyPayoutDeleted).toHaveBeenCalledWith(existingPayout);
      expect(result).toBe(true);
    });

    it('should return false when payout does not exist', async () => {
      // Arrange
      const payoutId = 999;
      
      mockPayoutRepository.findOne = jest.fn().mockResolvedValue(null);
      mockPayoutRepository.remove = jest.fn();

      // Act
      const result = await payoutService.deletePayout(payoutId);

      // Assert
      expect(mockPayoutRepository.findOne).toHaveBeenCalledWith({
        where: { id: payoutId },
        relations: ["campaign"],
      });
      expect(mockPayoutRepository.remove).not.toHaveBeenCalled();
      expect(mockIntegrationService.notifyPayoutDeleted).not.toHaveBeenCalled();
      expect(result).toBe(false);
    });

    it('should not notify integration service when campaign is not running', async () => {
      // Arrange
      const payoutId = 2;
      const existingPayout = { 
        ...mockPayoutData[0],
        campaign: {
          ...mockPayoutData[0].campaign,
          isRunning: false
        }
      };
      
      mockPayoutRepository.findOne = jest.fn().mockResolvedValue(existingPayout);
      mockPayoutRepository.remove = jest.fn().mockResolvedValue(existingPayout);

      // Act
      const result = await payoutService.deletePayout(payoutId);

      // Assert
      expect(mockPayoutRepository.findOne).toHaveBeenCalledWith({
        where: { id: payoutId },
        relations: ["campaign"],
      });
      expect(mockPayoutRepository.remove).toHaveBeenCalledWith(existingPayout);
      expect(mockIntegrationService.notifyPayoutDeleted).not.toHaveBeenCalled();
      expect(result).toBe(true);
    });
  });
});
