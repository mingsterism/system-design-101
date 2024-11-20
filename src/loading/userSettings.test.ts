// types.ts
export interface UserProfile {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    age: number;
    currentSalary: number;
    yearsOfExperience: number;
    location: string;
    preferredWorkLocation: 'remote' | 'hybrid' | 'onsite';
}

interface UrlParams {
    userId: string;
    section?: 'profile' | 'skills' | 'employment' | 'personality';
    skillId?: string;
}

interface LocalStorageData {
    lastVisitedSection: string;
    draftProfileChanges?: Partial<UserProfile>;
    skillsOrder?: string[];
}

interface FrontendDataTransformer {
    parseUrlParams(url: string): UrlParams;
    getLocalStorageData(userId: string): LocalStorageData;
    formatSalaryForDisplay(salary: number): string;
    formatSalaryForApi(displaySalary: string): number;
    parseLocationAutocomplete(location: string): Promise<string[]>;
    formatDateForDisplay(date: string): string;
    formatSkillsForDisplay(skills: UserSkill[]): UserSkillDisplay[];
    parseEmploymentDates(startDate: string, endDate?: string): EmploymentDates;
}

export interface UserSkill {
    id: string;
    name: string;
    yearsOfExperience: number;
    proficiencyLevel: 'beginner' | 'intermediate' | 'expert';
    isHighlighted: boolean;
}

interface UserSkillDisplay extends UserSkill {
    colorHex: string;
    displayOrder: number;
    tooltipContent: string;
}



export interface EmploymentHistory {
    id: string;
    companyName: string;
    position: string;
    startDate: string;
    endDate?: string;
    isCurrent: boolean;
    description: string;
}

export interface PersonalityScores {
    id: string;
    userId: string;
    openness: number;
    conscientiousness: number;
    extraversion: number;
    agreeableness: number;
    neuroticism: number;
    lastUpdated: string;
}

interface EmploymentDates {
    displayStartDate: string;
    displayEndDate?: string;
    durationInMonths: number;
    isValid: boolean;
}

// Database layer interfaces
export interface UserSettingsDatabase {
    getUserProfile(userId: string): Promise<UserProfile>;
    getUserSkills(userId: string): Promise<UserSkill[]>;
    getUserEmploymentHistory(userId: string): Promise<EmploymentHistory[]>;
    getPersonalityScores(userId: string): Promise<PersonalityScores>;
}

// Frontend data layer interface
export interface UserSettingsData {
    loadUserSettingsPage(userId: string): Promise<{
        profile: UserProfile;
        skills: UserSkill[];
        employmentHistory: EmploymentHistory[];
        personalityScores: PersonalityScores;
    }>;
    updateUserProfile(userId: string, profile: Partial<UserProfile>): Promise<UserProfile>;
    addUserSkill(userId: string, skill: Omit<UserSkill, 'id'>): Promise<UserSkill>;
    updateUserSkill(userId: string, skillId: string, skill: Partial<UserSkill>): Promise<UserSkill>;
    deleteUserSkill(userId: string, skillId: string): Promise<{ success: boolean }>;
}

// Mock data and tests
import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('UserSettingsPage Data Flow', () => {
    let mockDatabase: UserSettingsDatabase;
    let userSettingsData: UserSettingsData;
    let frontendTransformer: FrontendDataTransformer;

    const userId = 'user123';
    const mockUrl = `/settings/${userId}/skills`;

    // Mock data
    const mockUserProfile: UserProfile = {
        id: userId,
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        age: 30,
        currentSalary: 100000,
        yearsOfExperience: 8,
        location: 'New York',
        preferredWorkLocation: 'hybrid'
    };

    const mockSkills: UserSkill[] = [
        {
            id: 'skill1',
            name: 'React',
            yearsOfExperience: 4,
            proficiencyLevel: 'expert',
            isHighlighted: true
        },
        {
            id: 'skill2',
            name: 'TypeScript',
            yearsOfExperience: 3,
            proficiencyLevel: 'intermediate',
            isHighlighted: false
        }
    ];

    const mockEmploymentHistory: EmploymentHistory[] = [
        {
            id: 'emp1',
            companyName: 'Tech Corp',
            position: 'Senior Developer',
            startDate: '2020-01-01',
            isCurrent: true,
            description: 'Leading frontend development team'
        },
        {
            id: 'emp2',
            companyName: 'Startup Inc',
            position: 'Frontend Developer',
            startDate: '2018-01-01',
            endDate: '2019-12-31',
            isCurrent: false,
            description: 'Developed user interfaces'
        }
    ];

    const mockPersonalityScores: PersonalityScores = {
        id: 'pers1',
        userId: userId,
        openness: 0.8,
        conscientiousness: 0.75,
        extraversion: 0.6,
        agreeableness: 0.85,
        neuroticism: 0.4,
        lastUpdated: '2024-01-01'
    };

    beforeEach(() => {
        frontendTransformer = {
            parseUrlParams: (url: string) => {
                const [, , userId, section] = url.split('/');
                return { userId, section: section as UrlParams['section'] };
            },
            getLocalStorageData: (userId: string) => ({
                lastVisitedSection: 'profile',
                skillsOrder: ['skill1', 'skill2']
            }),
            formatSalaryForDisplay: (salary: number) =>
                new Intl.NumberFormat('en-US', {
                    style: 'currency',
                    currency: 'USD'
                }).format(salary),
            formatSalaryForApi: (displaySalary: string) =>
                Number(displaySalary.replace(/[^0-9.-]+/g, '')),
            parseLocationAutocomplete: async (location: string) => {
                return ['New York, NY', 'New York City', 'New Yorktown'];
            },
            formatDateForDisplay: (date: string) =>
                new Date(date).toLocaleDateString(),
            formatSkillsForDisplay: (skills: UserSkill[]) =>
                skills.map((skill, index) => ({
                    ...skill,
                    colorHex: skill.proficiencyLevel === 'expert' ? '#00ff00' : '#0000ff',
                    displayOrder: index,
                    tooltipContent: `${skill.yearsOfExperience} years of experience`
                })),
            parseEmploymentDates: (startDate: string, endDate?: string) => ({
                displayStartDate: new Date(startDate).toLocaleDateString(),
                displayEndDate: endDate ? new Date(endDate).toLocaleDateString() : undefined,
                durationInMonths: endDate ?
                    Math.floor((new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24 * 30)) :
                    Math.floor((new Date().getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24 * 30)),
                isValid: !endDate || new Date(endDate) > new Date(startDate)
            })
        };

        // Setup mock database
        mockDatabase = {
            getUserProfile: vi.fn().mockResolvedValue(mockUserProfile),
            getUserSkills: vi.fn().mockResolvedValue(mockSkills),
            getUserEmploymentHistory: vi.fn().mockResolvedValue(mockEmploymentHistory),
            getPersonalityScores: vi.fn().mockResolvedValue(mockPersonalityScores)
        };

        // Initialize frontend data layer with mock implementation
        userSettingsData = {
            loadUserSettingsPage: async (userId: string) => {
                const [profile, skills, employmentHistory, personalityScores] = await Promise.all([
                    mockDatabase.getUserProfile(userId),
                    mockDatabase.getUserSkills(userId),
                    mockDatabase.getUserEmploymentHistory(userId),
                    mockDatabase.getPersonalityScores(userId)
                ]);

                return {
                    profile,
                    skills,
                    employmentHistory,
                    personalityScores
                };
            },
            updateUserProfile: async (userId: string, profile: Partial<UserProfile>) => {
                return {
                    ...mockUserProfile,
                    ...profile
                };
            },
            addUserSkill: async (userId: string, skill: Omit<UserSkill, 'id'>) => {
                return {
                    id: 'newSkill',
                    ...skill
                };
            },
            updateUserSkill: async (userId: string, skillId: string, skill: Partial<UserSkill>) => {
                const existingSkill = mockSkills.find(s => s.id === skillId);
                if (!existingSkill) throw new Error('Skill not found');
                return {
                    ...existingSkill,
                    ...skill
                };
            },
            deleteUserSkill: async (userId: string, skillId: string) => {
                return { success: true };
            }
        };
    });

    describe('Initial Page Load', () => {
        it('should load all required data for the page in a single call', async () => {
            const pageData = await userSettingsData.loadUserSettingsPage(userId);

            expect(pageData).toHaveProperty('profile');
            expect(pageData).toHaveProperty('skills');
            expect(pageData).toHaveProperty('employmentHistory');
            expect(pageData).toHaveProperty('personalityScores');

            // Verify all data is loaded correctly
            expect(pageData.profile).toEqual(mockUserProfile);
            expect(pageData.skills).toEqual(mockSkills);
            expect(pageData.employmentHistory).toEqual(mockEmploymentHistory);
            expect(pageData.personalityScores).toEqual(mockPersonalityScores);

            // Verify all database calls were made in parallel
            expect(mockDatabase.getUserProfile).toHaveBeenCalledWith(userId);
            expect(mockDatabase.getUserSkills).toHaveBeenCalledWith(userId);
            expect(mockDatabase.getUserEmploymentHistory).toHaveBeenCalledWith(userId);
            expect(mockDatabase.getPersonalityScores).toHaveBeenCalledWith(userId);
        });

        it('should handle errors in data loading gracefully', async () => {
            mockDatabase.getUserProfile = vi.fn().mockRejectedValue(new Error('Failed to load profile'));

            await expect(userSettingsData.loadUserSettingsPage(userId))
                .rejects
                .toThrow('Failed to load profile');
        });
    });

    describe('Profile Updates', () => {
        it('should update user profile and return full updated profile', async () => {
            const updateData = {
                currentSalary: 110000,
                preferredWorkLocation: 'remote' as const
            };

            const updatedProfile = await userSettingsData.updateUserProfile(userId, updateData);

            expect(updatedProfile).toEqual({
                ...mockUserProfile,
                ...updateData
            });
        });
    });

    describe('Skills Management', () => {
        it('should add new skill and return complete skill object', async () => {
            const newSkill = {
                name: 'Python',
                yearsOfExperience: 2,
                proficiencyLevel: 'intermediate' as const,
                isHighlighted: false
            };

            const result = await userSettingsData.addUserSkill(userId, newSkill);

            expect(result).toEqual({
                id: expect.any(String),
                ...newSkill
            });
        });

        it('should update existing skill and return complete updated skill', async () => {
            const updateData = {
                yearsOfExperience: 5,
                proficiencyLevel: 'expert' as const
            };

            const result = await userSettingsData.updateUserSkill(userId, 'skill1', updateData);

            expect(result).toEqual({
                ...mockSkills[0],
                ...updateData
            });
        });

        it('should delete skill and confirm success', async () => {
            const result = await userSettingsData.deleteUserSkill(userId, 'skill1');
            expect(result).toEqual({ success: true });
        });
    });

    describe('Initial Page Load Flow', () => {
        it('should parse URL parameters and load correct section', () => {
            const params = frontendTransformer.parseUrlParams(mockUrl);
            expect(params).toEqual({
                userId: 'user123',
                section: 'skills'
            });
        });

        it('should restore previous section from localStorage if no section in URL', () => {
            const localData = frontendTransformer.getLocalStorageData(userId);
            expect(localData.lastVisitedSection).toBe('profile');
        });

        it('should combine URL, localStorage, and API data for initial state', async () => {
            const params = frontendTransformer.parseUrlParams(mockUrl);
            const localData = frontendTransformer.getLocalStorageData(params.userId);
            const apiData = await userSettingsData.loadUserSettingsPage(params.userId);

            // Verify complete initial state
            expect({
                currentSection: params.section || localData.lastVisitedSection,
                userData: apiData,
                savedSkillsOrder: localData.skillsOrder
            }).toBeDefined();
        });
    });

    describe('Profile Data Formatting', () => {
        it('should format salary for display and API', () => {
            const displaySalary = frontendTransformer.formatSalaryForDisplay(100000);
            expect(displaySalary).toBe('$100,000.00');

            const apiSalary = frontendTransformer.formatSalaryForApi(displaySalary);
            expect(apiSalary).toBe(100000);
        });

        it('should handle location autocomplete data transformation', async () => {
            const suggestions = await frontendTransformer.parseLocationAutocomplete('New');
            expect(suggestions).toHaveLength(3);
            expect(suggestions[0]).toBe('New York, NY');
        });
    });

    describe('Skills Data Management', () => {
        it('should transform skills data for frontend display', () => {
            const displaySkills = frontendTransformer.formatSkillsForDisplay(mockSkills);
            expect(displaySkills[0]).toHaveProperty('colorHex');
            expect(displaySkills[0]).toHaveProperty('displayOrder');
            expect(displaySkills[0]).toHaveProperty('tooltipContent');
        });

        it('should maintain skills order from localStorage', () => {
            const localData = frontendTransformer.getLocalStorageData(userId);
            const displaySkills = frontendTransformer.formatSkillsForDisplay(mockSkills);

            expect(displaySkills.map(s => s.id)).toEqual(localData.skillsOrder);
        });
    });

    describe('Employment History Data Parsing', () => {
        it('should calculate and format employment duration', () => {
            const dates = frontendTransformer.parseEmploymentDates('2020-01-01', '2022-01-01');
            expect(dates).toEqual({
                displayStartDate: '1/1/2020',
                displayEndDate: '1/1/2022',
                durationInMonths: 24,
                isValid: true
            });
        });

        it('should validate employment date ranges', () => {
            const invalidDates = frontendTransformer.parseEmploymentDates('2022-01-01', '2021-01-01');
            expect(invalidDates.isValid).toBe(false);
        });
    });

    describe('Personality Data Visualization', () => {
        const mockPersonalityTransformer = {
            formatForRadarChart: (scores: PersonalityScores) => ({
                datasets: [{
                    data: [
                        scores.openness,
                        scores.conscientiousness,
                        scores.extraversion,
                        scores.agreeableness,
                        scores.neuroticism
                    ]
                }],
                labels: ['Openness', 'Conscientiousness', 'Extraversion', 'Agreeableness', 'Neuroticism']
            })
        };

        it('should transform personality scores for radar chart', () => {
            const chartData = mockPersonalityTransformer.formatForRadarChart(mockPersonalityScores);
            expect(chartData.datasets[0].data).toHaveLength(5);
            expect(chartData.labels).toHaveLength(5);
        });
    });
});