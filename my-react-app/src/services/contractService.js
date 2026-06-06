const FULLTIME_API_URL = 'http://localhost:5000/api/fulltime-contracts';
const FREELANCE_API_URL = 'http://localhost:5000/api/freelance-contracts';

export const contractService = {
  // Get all fulltime contracts
  getAllContracts: async () => {
    try {
      const response = await fetch(`${FULLTIME_API_URL}`);
      if (!response.ok) throw new Error('Failed to fetch contracts');
      return await response.json();
    } catch (error) {
      console.error('Error fetching contracts:', error);
      throw error;
    }
  },

  // Get fulltime contract by ID
  getContractById: async (id) => {
    try {
      const response = await fetch(`${FULLTIME_API_URL}/${id}`);
      if (!response.ok) throw new Error('Failed to fetch contract');
      return await response.json();
    } catch (error) {
      console.error('Error fetching contract:', error);
      throw error;
    }
  },

  // Get freelance contract by ID
  getFreelanceContractById: async (id) => {
    try {
      const response = await fetch(`${FREELANCE_API_URL}/${id}`);
      if (!response.ok) throw new Error('Failed to fetch freelance contract');
      return await response.json();
    } catch (error) {
      console.error('Error fetching freelance contract:', error);
      throw error;
    }
  },

  // Get allowances for a contract
  getAllowances: async (contractId) => {
    try {
      const response = await fetch(`${FULLTIME_API_URL}/${contractId}/allowances`);
      if (!response.ok) throw new Error('Failed to fetch allowances');
      return await response.json();
    } catch (error) {
      console.error('Error fetching allowances:', error);
      throw error;
    }
  },

  // Get bonuses for a contract
  getBonuses: async (contractId) => {
    try {
      const response = await fetch(`${FULLTIME_API_URL}/${contractId}/bonuses`);
      if (!response.ok) throw new Error('Failed to fetch bonuses');
      return await response.json();
    } catch (error) {
      console.error('Error fetching bonuses:', error);
      throw error;
    }
  },

  // Get deductions for a contract
  getDeductions: async (contractId) => {
    try {
      const response = await fetch(`${FULLTIME_API_URL}/${contractId}/deductions`);
      if (!response.ok) throw new Error('Failed to fetch deductions');
      return await response.json();
    } catch (error) {
      console.error('Error fetching deductions:', error);
      throw error;
    }
  },

  // Get contract with all details (allowances, bonuses, deductions)
  // Supports both fulltime and freelance contracts
  getContractDetails: async (contractId, isFreelance = false) => {
    try {
      if (isFreelance) {
        // Freelance contract: getContractById already includes bonuses and deductions
        const contract = await contractService.getFreelanceContractById(contractId);
        return {
          ...contract,
          allowances: [], // Freelance contracts don't have allowances
          bonuses: contract.bonuses || [],
          deductions: contract.deductions || []
        };
      } else {
        // Fulltime contract: fetch in parallel
        const [contract, allowances, bonuses, deductions] = await Promise.all([
          contractService.getContractById(contractId),
          contractService.getAllowances(contractId),
          contractService.getBonuses(contractId),
          contractService.getDeductions(contractId)
        ]);

        return {
          ...contract,
          allowances,
          bonuses,
          deductions
        };
      }
    } catch (error) {
      console.error('Error fetching contract details:', error);
      throw error;
    }
  }
};

