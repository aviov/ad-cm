// Helper functions and mock data for tests
import { Repository, ObjectLiteral, SelectQueryBuilder, DataSource, EntityTarget } from 'typeorm';
import { Campaign } from '../../src/entities/Campaign';
import { Payout } from '../../src/entities/Payout';
import { Country } from '../../src/entities/Country';

// Type to represent our mock query builder with just the methods we need
type MockQueryBuilder = {
  where: jest.Mock;
  andWhere: jest.Mock;
  leftJoinAndSelect: jest.Mock;
  orderBy: jest.Mock;
  getMany: jest.Mock;
  getOne: jest.Mock;
  execute: jest.Mock;
};

// Mock repositories for each entity type
const mockRepositories: Record<string, jest.Mocked<Partial<Repository<any>>>> = {};

/**
 * Creates a mock TypeORM repository with common methods
 * Returns a partial implementation that can be safely cast to Repository<T>
 */
export const createMockRepository = <T extends ObjectLiteral = any>(): jest.Mocked<Partial<Repository<T>>> => {
  // Create a mock query builder that returns itself for method chaining
  const mockQueryBuilder = {
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    getMany: jest.fn(),
    getOne: jest.fn(),
    execute: jest.fn(),
  } as unknown as jest.Mocked<SelectQueryBuilder<T>>;

  return {
    find: jest.fn(),
    findOne: jest.fn(),
    findOneBy: jest.fn(),
    save: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    createQueryBuilder: jest.fn(() => mockQueryBuilder),
    metadata: {
      name: 'MockEntity',
      tableName: 'mock_table',
      columns: [],
      relations: []
    }
  } as unknown as jest.Mocked<Partial<Repository<T>>>;
};

/**
 * Gets the entity name as string from an EntityTarget
 */
export const getEntityName = (entity: EntityTarget<any>): string => {
  if (typeof entity === 'function') {
    return entity.name;
  }
  if (typeof entity === 'object' && entity !== null && 'name' in entity) {
    return entity.name as string;
  }
  return String(entity);
};

/**
 * Mock for the AppDataSource with entity metadata
 */
export const MockAppDataSource = {
  getRepository: jest.fn((entity: EntityTarget<any>) => {
    const entityName = getEntityName(entity);
    
    // Create repository if it doesn't exist
    if (!mockRepositories[entityName]) {
      mockRepositories[entityName] = createMockRepository();
    }
    
    return mockRepositories[entityName];
  }),
  manager: {
    getRepository: jest.fn((entity: EntityTarget<any>) => {
      const entityName = getEntityName(entity);
      
      // Create repository if it doesn't exist
      if (!mockRepositories[entityName]) {
        mockRepositories[entityName] = createMockRepository();
      }
      
      return mockRepositories[entityName];
    })
  },
  // Add metadata for all entities to prevent metadata not found errors
  getMetadata: jest.fn((entity: EntityTarget<any>) => {
    const entityName = getEntityName(entity);
    
    // Create basic metadata for common entities
    const metadataMap: Record<string, any> = {
      'Campaign': {
        name: 'Campaign',
        tableName: 'campaign',
        columns: [
          { propertyName: 'id', isPrimary: true },
          { propertyName: 'title' },
          { propertyName: 'landingPageUrl' },
          { propertyName: 'isRunning' },
          { propertyName: 'createdAt' },
          { propertyName: 'updatedAt' }
        ],
        relations: [
          { propertyName: 'payouts', type: 'one-to-many', target: 'Payout' }
        ]
      },
      'Payout': {
        name: 'Payout',
        tableName: 'payout',
        columns: [
          { propertyName: 'id', isPrimary: true },
          { propertyName: 'amount' },
          { propertyName: 'budget' },
          { propertyName: 'autoStop' },
          { propertyName: 'campaignId' },
          { propertyName: 'countryId' },
          { propertyName: 'createdAt' },
          { propertyName: 'updatedAt' }
        ],
        relations: [
          { propertyName: 'campaign', type: 'many-to-one', target: 'Campaign' },
          { propertyName: 'country', type: 'many-to-one', target: 'Country' }
        ]
      },
      'Country': {
        name: 'Country',
        tableName: 'country',
        columns: [
          { propertyName: 'id', isPrimary: true },
          { propertyName: 'name' },
          { propertyName: 'code' }
        ],
        relations: [
          { propertyName: 'payouts', type: 'one-to-many', target: 'Payout' }
        ]
      }
    };
    
    return metadataMap[entityName] || {
      name: entityName,
      tableName: entityName.toLowerCase(),
      columns: [{ propertyName: 'id', isPrimary: true }],
      relations: []
    };
  })
} as unknown as jest.Mocked<DataSource>;

// Reset mock repositories between tests
export const resetMockRepositories = () => {
  Object.keys(mockRepositories).forEach(key => {
    delete mockRepositories[key];
  });
};

// Sample mock campaign data
export const mockCampaignData: Campaign[] = [
  {
    id: 1,
    title: 'Test Campaign 1',
    landingPageUrl: 'https://example.com/1',
    isRunning: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    payouts: []
  } as Campaign,
  {
    id: 2,
    title: 'Test Campaign 2',
    landingPageUrl: 'https://example.com/2',
    isRunning: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    payouts: []
  } as Campaign
];

// Sample mock payout data
export const mockPayoutData: Payout[] = [
  {
    id: 1,
    amount: 1.5,
    budget: 100,
    autoStop: false,
    budgetAlert: false,
    budgetAlertEmail: '',
    createdAt: new Date(),
    updatedAt: new Date(),
    campaign: mockCampaignData[0],
    country: {
      id: 1,
      name: 'United States',
      code: 'US',
      payouts: []
    } as Country,
    countryId: 1
  } as Payout,
  {
    id: 2,
    amount: 2.0,
    budget: 200,
    autoStop: true,
    budgetAlert: true,
    budgetAlertEmail: 'test@example.com',
    createdAt: new Date(),
    updatedAt: new Date(),
    campaign: mockCampaignData[0],
    country: {
      id: 2,
      name: 'Canada',
      code: 'CA',
      payouts: []
    } as Country,
    countryId: 2
  } as Payout
];
