import { describe, it, expect, beforeEach } from 'vitest';
// types.ts
export interface Employment {
    id: string;
    companyName: string;
    position: string;
    startDate: string;  // ISO date string
    endDate?: string;   // ISO date string, optional for current employment
    description: string;
    isCurrent: boolean;
}

export interface NewEmployment extends Omit<Employment, 'id'> {}

export interface UpdateEmployment extends Partial<Employment> {
    id: string;  // Required for updates
}

// interfaces.ts
export interface EmploymentHistoryService {
    getCurrentEmploymentHistory(userId: string): Promise<Employment[]>;
    addEmploymentHistory(userId: string, employment: NewEmployment): Promise<Employment>;
    updateEmploymentHistory(userId: string, employment: UpdateEmployment): Promise<Employment>;
    deleteEmploymentHistory(userId: string, employmentId: string): Promise<void>;
}

export interface EmploymentHistoryPageLogic {
    loadEmploymentHistory(): Promise<Employment[]>;
    addNewEmployment(employment: NewEmployment): Promise<Employment>;
    updateEmployment(employment: UpdateEmployment): Promise<Employment>;
    deleteEmployment(employmentId: string): Promise<void>;
    validateEmployment(employment: NewEmployment | UpdateEmployment): boolean;
}

// implementations.ts
export class EmploymentHistoryManager implements EmploymentHistoryPageLogic {
    private userId: string;

    constructor(
        private employmentService: EmploymentHistoryService,
        userId: string
    ) {
        this.userId = userId;
    }

    async loadEmploymentHistory(): Promise<Employment[]> {
        return this.employmentService.getCurrentEmploymentHistory(this.userId);
    }

    async addNewEmployment(employment: NewEmployment): Promise<Employment> {
        if (!this.validateEmployment(employment)) {
            throw new Error('Invalid employment data');
        }

        // If marked as current employment, ensure no other current employment exists
        if (employment.isCurrent) {
            const currentHistory = await this.loadEmploymentHistory();
            const hasCurrentEmployment = currentHistory.some(emp => emp.isCurrent);
            
            if (hasCurrentEmployment) {
                throw new Error('Cannot add new current employment when one already exists');
            }
        }

        return this.employmentService.addEmploymentHistory(this.userId, employment);
    }

    async updateEmployment(employment: UpdateEmployment): Promise<Employment> {
        if (!this.validateEmployment(employment as NewEmployment)) {
            throw new Error('Invalid employment data');
        }

        // If updating to current employment, ensure no other current employment exists
        if (employment.isCurrent) {
            const currentHistory = await this.loadEmploymentHistory();
            const hasOtherCurrentEmployment = currentHistory
                .some(emp => emp.isCurrent && emp.id !== employment.id);
            
            if (hasOtherCurrentEmployment) {
                throw new Error('Cannot have multiple current employments');
            }
        }

        return this.employmentService.updateEmploymentHistory(this.userId, employment);
    }

    async deleteEmployment(employmentId: string): Promise<void> {
        return this.employmentService.deleteEmploymentHistory(this.userId, employmentId);
    }

    validateEmployment(employment: NewEmployment | UpdateEmployment): boolean {
        // Basic validation rules
        if ('companyName' in employment && (!employment.companyName?.trim())) {
            return false;
        }

        if ('startDate' in employment) {
            const startDate = new Date(employment.startDate);
            if (isNaN(startDate.getTime())) {
                return false;
            }

            // If end date is provided, validate it's after start date
            if (employment.endDate) {
                const endDate = new Date(employment.endDate);
                if (isNaN(endDate.getTime()) || endDate < startDate) {
                    return false;
                }
            }
        }

        return true;
    }
}

// Mock implementation for testing/demo
export class MockEmploymentHistoryService implements EmploymentHistoryService {
    private employments: Map<string, Employment[]> = new Map();

    async getCurrentEmploymentHistory(userId: string): Promise<Employment[]> {
        return this.employments.get(userId) || [];
    }

    async addEmploymentHistory(userId: string, employment: NewEmployment): Promise<Employment> {
        const newEmployment: Employment = {
            ...employment,
            id: Math.random().toString(36).substring(7)
        };

        if (!this.employments.has(userId)) {
            this.employments.set(userId, []);
        }

        this.employments.get(userId)!.push(newEmployment);
        return newEmployment;
    }

    async updateEmploymentHistory(userId: string, employment: UpdateEmployment): Promise<Employment> {
        const userEmployments = this.employments.get(userId) || [];
        const index = userEmployments.findIndex(emp => emp.id === employment.id);
        
        if (index === -1) {
            throw new Error('Employment not found');
        }

        const updatedEmployment = {
            ...userEmployments[index],
            ...employment
        };

        userEmployments[index] = updatedEmployment;
        return updatedEmployment;
    }

    async deleteEmploymentHistory(userId: string, employmentId: string): Promise<void> {
        const userEmployments = this.employments.get(userId) || [];
        const filteredEmployments = userEmployments.filter(emp => emp.id !== employmentId);
        this.employments.set(userId, filteredEmployments);
    }
}


















// tests.ts
// import { EmploymentHistoryManager, MockEmploymentHistoryService } from './implementations';
// import type { Employment, NewEmployment, UpdateEmployment } from './types';

describe('EmploymentHistoryManager', () => {
    let service: MockEmploymentHistoryService;
    let manager: EmploymentHistoryManager;
    const userId = 'user123';

    const mockEmployment: NewEmployment = {
        companyName: 'Test Company',
        position: 'Software Engineer',
        startDate: '2020-01-01',
        endDate: '2021-12-31',
        description: 'Test description',
        isCurrent: false
    };

    beforeEach(() => {
        service = new MockEmploymentHistoryService();
        manager = new EmploymentHistoryManager(service, userId);
    });

    describe('loadEmploymentHistory', () => {
        it('should return empty array when no employment history exists', async () => {
            const history = await manager.loadEmploymentHistory();
            expect(history).toEqual([]);
        });

        it('should return existing employment history', async () => {
            const added = await manager.addNewEmployment(mockEmployment);
            const history = await manager.loadEmploymentHistory();
            expect(history).toEqual([added]);
        });
    });

    describe('addNewEmployment', () => {
        it('should add new employment successfully', async () => {
            const result = await manager.addNewEmployment(mockEmployment);
            expect(result).toMatchObject(mockEmployment);
            expect(result.id).toBeDefined();
        });

        it('should fail when adding second current employment', async () => {
            const currentEmployment = { ...mockEmployment, isCurrent: true };
            await manager.addNewEmployment(currentEmployment);

            await expect(
                manager.addNewEmployment(currentEmployment)
            ).rejects.toThrow('Cannot add new current employment when one already exists');
        });

        it('should validate employment data', async () => {
            const invalidEmployment = { ...mockEmployment, companyName: '' };
            await expect(
                manager.addNewEmployment(invalidEmployment)
            ).rejects.toThrow('Invalid employment data');
        });
    });

    describe('updateEmployment', () => {
        it('should update existing employment', async () => {
            const added = await manager.addNewEmployment(mockEmployment);
            const update: UpdateEmployment = {
                id: added.id,
                companyName: 'Updated Company'
            };

            const result = await manager.updateEmployment(update);
            expect(result.companyName).toBe('Updated Company');
        });

        it('should validate dates during update', async () => {
            const added = await manager.addNewEmployment(mockEmployment);
            const update: UpdateEmployment = {
                id: added.id,
                startDate: '2022-01-01',
                endDate: '2021-01-01'  // Invalid: end date before start date
            };

            await expect(
                manager.updateEmployment(update)
            ).rejects.toThrow('Invalid employment data');
        });
    });

    describe('deleteEmployment', () => {
        it('should delete employment successfully', async () => {
            const added = await manager.addNewEmployment(mockEmployment);
            await manager.deleteEmployment(added.id);
            const history = await manager.loadEmploymentHistory();
            expect(history).toEqual([]);
        });
    });

    describe('validateEmployment', () => {
        it('should validate company name', () => {
            expect(manager.validateEmployment({
                ...mockEmployment,
                companyName: ''
            })).toBe(false);
        });

        it('should validate dates', () => {
            expect(manager.validateEmployment({
                ...mockEmployment,
                startDate: '2022-01-01',
                endDate: '2021-01-01'
            })).toBe(false);
        });

        it('should accept valid employment', () => {
            expect(manager.validateEmployment(mockEmployment)).toBe(true);
        });
    });

});







// // DATA DRIVEN DESIGN. Data mapping, data transformation & data pipping between the functions. 

// // loading data
// /**
//  * const a = someFunc(dataA)
//  * const resB = someFuncB(a, valA)
//  * const resC = someFuncC (resB)
//  */


// // click buttonA first. then buttonB get unhidden. inputA gets bolded. when i click buttonB, modalA appears with sidebar

// // pageB
// // takes data from 3 different sources. all sorts of funny logic to merge and mesh the data together and all sort of conditionals. 
// // we need all our types. for merge and mix data together as payload for function inputs and outputs, we should create custom types. 
// // to test all the conditional logic for that page, we should do it inside of vitest

// // do i do multiple functions on the page.svelte, or do i do it on the backend and combine them into a single function and modify the types. 









// export interface UserInformation {
//     employmenthistory: EmploymentHistory
//     someBlabla: blabla[]
//     blabla2: blabla2
// }
// // WE NEED TO ABSTRACT OUT THE VISUAL BECAUSE WE DONT HAVE A VISUAL BRAIN. we dont NEED A VISUAL BRAIN

// // on user profile page, i can do abcdef blabla. i can gety employment siebar 
// function userProfileProfilePAGE!!!({
//     routeParams: {
//         userId: "sdfsdf", 
//         orgId: "sdfsd"
//     },
//     localState: {
//         userId
//     }
// }) {
//     const currentUserEmploymentHistory = classA.loadUserEmploymentHistory({userId: localState.userId})
//     const userProfile = loadUserProfile()
//     const someRandomUserInformation  = classB.loadUserInformation()
    
//     getEmploymentDetails(employmentId)

//     addEmploymentHistory(newData) {
//         db.insert(employmentHistory).values(newData)
//     }
//     deleteEmploymentHistory(employmentId: string)
//     updateRandomUserInformation(inputPayload: InputPayload)
    

//     updateEmploymentHistory(currentEmploymentHistory, newData)
// }























// settings page
/**
 * call
 */

function settingsPage() {
    const settingsData = loadAllSettingsData()
        const settingsA = loadSettingsPtA()
        const settingsB = loadSettingsPtB()
        const settingsC = loadSettingsPtC()

    const updatedSettingsData = updateSettingsData()

    // CONFLICT
    const deleteSkillPayload = deleteSkills({skillID}): <boolean, Skill> 
    // after i delete the skill, then open a modal to say "SKILL NAME OF Golang was deleted"

    const returnSkillPayload = addSkills(): <boolean, Skill>
    const getEmploymentHistory = get()
}


















// ALWAYS RETURN THE FULL ROOT PAYLOAD OF THE DB CALL, BE IT INSERT, DELETE OR UPDATE WITHOUT JOINS. 
// I CAN GET THE FULL PAYLOAD AT NO EXTRA COMPUTE COST. ITS FREEE !!!!!!!

    // CONFLICT. Data Logic and Visual Logic conflict
    const deleteSkillID = deleteSkills({skillID}): <boolean, Skill>  //(i can return this in a single DB Call)
    const deletedSkill = getSkill({id: deleteSkillID})

    


















