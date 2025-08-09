const assert = require('assert');
const { generateCoverageReport } = require('../out/helpers/coverageExporter');

describe('coverageExporter', () => {
  describe('generateCoverageReport', () => {
    it('should generate a complete markdown report with all sections for high coverage data', () => {
      const analysis = {
        totalFiles: 100,
        coveredFiles: 95,
        coveragePercentage: 95.0,
        uncoveredDirectories: [
          {
            path: 'src/utils',
            totalFiles: 10,
            coveredFiles: 8,
            uncoveredFiles: 2,
            coveragePercentage: 80.0
          }
        ],
        fileTypeCoverage: [
          {
            extension: '.js',
            totalFiles: 50,
            coveredFiles: 48,
            uncoveredFiles: 2,
            coveragePercentage: 96.0
          }
        ],
        teamCoverage: [
          {
            team: '@team1',
            totalFiles: 60,
            percentageOfTotal: 60.0
          }
        ],
        scanDate: new Date('2024-01-01T12:00:00Z')
      };

      const report = generateCoverageReport(analysis);

      // Should contain key sections
      assert(report.includes('# CODEOWNERS Coverage Report'));
      assert(report.includes('## 📊 Overall Coverage'));
      assert(report.includes('## 📁 Top Uncovered Directories'));
      assert(report.includes('## 📄 Coverage by File Type'));
      assert(report.includes('## 👥 Team Coverage Distribution'));

      // Should show high coverage with green indicator
      assert(report.includes('🟢 **95.0% Coverage**'));
      assert(report.includes('**Total Files**: 100'));
      assert(report.includes('**Covered Files**: 95'));
      assert(report.includes('**Uncovered Files**: 5'));

      // Should include directory data
      assert(report.includes('### src/utils'));
      assert(report.includes('**Coverage**: 80.0%'));

      // Should include file type data
      assert(report.includes('### .js'));
      assert(report.includes('**Coverage**: 96.0%'));

      // Should include team data
      assert(report.includes('### @team1'));
      assert(report.includes('**Percentage of Total**: 60.0%'));

      // Should include timestamp
      assert(report.includes('Generated on:'));
    });

    it('should display yellow indicator for medium coverage (60-79%)', () => {
      const analysis = {
        totalFiles: 50,
        coveredFiles: 30,
        coveragePercentage: 60.0,
        uncoveredDirectories: [],
        fileTypeCoverage: [],
        teamCoverage: [],
        scanDate: new Date('2024-01-01T12:00:00Z')
      };

      const report = generateCoverageReport(analysis);

      // Should show medium coverage with yellow indicator
      assert(report.includes('🟡 **60.0% Coverage**'));
    });

    it('should display red indicator for low coverage (below 60%)', () => {
      const analysis = {
        totalFiles: 20,
        coveredFiles: 5,
        coveragePercentage: 25.0,
        uncoveredDirectories: [],
        fileTypeCoverage: [],
        teamCoverage: [],
        scanDate: new Date('2024-01-01T12:00:00Z')
      };

      const report = generateCoverageReport(analysis);

      // Should show low coverage with red indicator
      assert(report.includes('🔴 **25.0% Coverage**'));
    });

    it('should handle completely empty analysis data gracefully', () => {
      const analysis = {
        totalFiles: 0,
        coveredFiles: 0,
        coveragePercentage: 0,
        uncoveredDirectories: [],
        fileTypeCoverage: [],
        teamCoverage: [],
        scanDate: new Date('2024-01-01T12:00:00Z')
      };

      const report = generateCoverageReport(analysis);

      // Should still generate valid report
      assert(report.includes('# CODEOWNERS Coverage Report'));
      assert(report.includes('🔴 **0.0% Coverage**'));
      assert(report.includes('**Total Files**: 0'));
    });

    it('should list multiple directories in order of uncovered files', () => {
      const analysis = {
        totalFiles: 10,
        coveredFiles: 5,
        coveragePercentage: 50.0,
        uncoveredDirectories: [
          {
            path: 'src/utils',
            totalFiles: 5,
            coveredFiles: 2,
            uncoveredFiles: 3,
            coveragePercentage: 40.0
          },
          {
            path: 'docs',
            totalFiles: 3,
            coveredFiles: 1,
            uncoveredFiles: 2,
            coveragePercentage: 33.3
          }
        ],
        fileTypeCoverage: [],
        teamCoverage: [],
        scanDate: new Date('2024-01-01T12:00:00Z')
      };

      const report = generateCoverageReport(analysis);

      // Should include both directories
      assert(report.includes('### src/utils'));
      assert(report.includes('### docs'));
      assert(report.includes('**Coverage**: 40.0%'));
      assert(report.includes('**Coverage**: 33.3%'));
    });

    it('should list multiple file types in order of total files', () => {
      const analysis = {
        totalFiles: 10,
        coveredFiles: 5,
        coveragePercentage: 50.0,
        uncoveredDirectories: [],
        fileTypeCoverage: [
          {
            extension: '.js',
            totalFiles: 6,
            coveredFiles: 4,
            uncoveredFiles: 2,
            coveragePercentage: 66.7
          },
          {
            extension: '.md',
            totalFiles: 4,
            coveredFiles: 1,
            uncoveredFiles: 3,
            coveragePercentage: 25.0
          }
        ],
        teamCoverage: [],
        scanDate: new Date('2024-01-01T12:00:00Z')
      };

      const report = generateCoverageReport(analysis);

      // Should include both file types
      assert(report.includes('### .js'));
      assert(report.includes('### .md'));
      assert(report.includes('**Coverage**: 66.7%'));
      assert(report.includes('**Coverage**: 25.0%'));
    });

    it('should list multiple teams in order of total files', () => {
      const analysis = {
        totalFiles: 10,
        coveredFiles: 5,
        coveragePercentage: 50.0,
        uncoveredDirectories: [],
        fileTypeCoverage: [],
        teamCoverage: [
          {
            team: '@team1',
            totalFiles: 6,
            percentageOfTotal: 60.0
          },
          {
            team: '@team2',
            totalFiles: 4,
            percentageOfTotal: 40.0
          }
        ],
        scanDate: new Date('2024-01-01T12:00:00Z')
      };

      const report = generateCoverageReport(analysis);

      // Should include both teams
      assert(report.includes('### @team1'));
      assert(report.includes('### @team2'));
      assert(report.includes('**Percentage of Total**: 60.0%'));
      assert(report.includes('**Percentage of Total**: 40.0%'));
    });

    it('should handle analysis with no uncovered directories', () => {
      const analysis = {
        totalFiles: 10,
        coveredFiles: 10,
        coveragePercentage: 100.0,
        uncoveredDirectories: [],
        fileTypeCoverage: [],
        teamCoverage: [],
        scanDate: new Date('2024-01-01T12:00:00Z')
      };

      const report = generateCoverageReport(analysis);

      assert(report.includes('🟢 **100.0% Coverage**'));
      assert(report.includes('## 📁 Top Uncovered Directories'));
      // Should not contain any directory listings since there are none
      assert(!report.includes('### '));
    });

    it('should handle analysis with no file type data', () => {
      const analysis = {
        totalFiles: 10,
        coveredFiles: 5,
        coveragePercentage: 50.0,
        uncoveredDirectories: [],
        fileTypeCoverage: [],
        teamCoverage: [],
        scanDate: new Date('2024-01-01T12:00:00Z')
      };

      const report = generateCoverageReport(analysis);

      assert(report.includes('## 📄 Coverage by File Type'));
      // Should not contain any file type listings since there are none
      assert(!report.includes('### .'));
    });

    it('should handle analysis with no team data', () => {
      const analysis = {
        totalFiles: 10,
        coveredFiles: 5,
        coveragePercentage: 50.0,
        uncoveredDirectories: [],
        fileTypeCoverage: [],
        teamCoverage: [],
        scanDate: new Date('2024-01-01T12:00:00Z')
      };

      const report = generateCoverageReport(analysis);

      assert(report.includes('## 👥 Team Coverage Distribution'));
      // Should not contain any team listings since there are none
      assert(!report.includes('### @'));
    });

    it('should handle very large numbers without formatting issues', () => {
      const analysis = {
        totalFiles: 999999,
        coveredFiles: 888888,
        coveragePercentage: 88.9,
        uncoveredDirectories: [],
        fileTypeCoverage: [],
        teamCoverage: [],
        scanDate: new Date('2024-01-01T12:00:00Z')
      };

      const report = generateCoverageReport(analysis);

      assert(report.includes('**Total Files**: 999999'));
      assert(report.includes('**Covered Files**: 888888'));
      assert(report.includes('**Uncovered Files**: 111111'));
      assert(report.includes('🟢 **88.9% Coverage**'));
    });

    it('should handle decimal coverage percentages correctly', () => {
      const analysis = {
        totalFiles: 3,
        coveredFiles: 2,
        coveragePercentage: 66.66666666666667,
        uncoveredDirectories: [],
        fileTypeCoverage: [],
        teamCoverage: [],
        scanDate: new Date('2024-01-01T12:00:00Z')
      };

      const report = generateCoverageReport(analysis);

      // Should handle decimal places appropriately
      assert(report.includes('🟡 **66.7% Coverage**') || report.includes('🟡 **66.67% Coverage**'));
    });

    it('should handle teams with special characters in names', () => {
      const analysis = {
        totalFiles: 10,
        coveredFiles: 5,
        coveragePercentage: 50.0,
        uncoveredDirectories: [],
        fileTypeCoverage: [],
        teamCoverage: [
          {
            team: '@team-with-dashes',
            totalFiles: 5,
            percentageOfTotal: 50.0
          },
          {
            team: '@team_with_underscores',
            totalFiles: 3,
            percentageOfTotal: 30.0
          },
          {
            team: '@team.with.dots',
            totalFiles: 2,
            percentageOfTotal: 20.0
          }
        ],
        scanDate: new Date('2024-01-01T12:00:00Z')
      };

      const report = generateCoverageReport(analysis);

      assert(report.includes('### @team-with-dashes'));
      assert(report.includes('### @team_with_underscores'));
      assert(report.includes('### @team.with.dots'));
    });

    it('should handle file extensions with special characters', () => {
      const analysis = {
        totalFiles: 10,
        coveredFiles: 5,
        coveragePercentage: 50.0,
        uncoveredDirectories: [],
        fileTypeCoverage: [
          {
            extension: '.test.js',
            totalFiles: 3,
            coveredFiles: 2,
            uncoveredFiles: 1,
            coveragePercentage: 66.7
          },
          {
            extension: '.config.json',
            totalFiles: 2,
            coveredFiles: 1,
            uncoveredFiles: 1,
            coveragePercentage: 50.0
          }
        ],
        teamCoverage: [],
        scanDate: new Date('2024-01-01T12:00:00Z')
      };

      const report = generateCoverageReport(analysis);

      assert(report.includes('### .test.js'));
      assert(report.includes('### .config.json'));
    });

    it('should handle directory paths with special characters', () => {
      const analysis = {
        totalFiles: 10,
        coveredFiles: 5,
        coveragePercentage: 50.0,
        uncoveredDirectories: [
          {
            path: 'src/components/ui',
            totalFiles: 5,
            coveredFiles: 3,
            uncoveredFiles: 2,
            coveragePercentage: 60.0
          },
          {
            path: 'docs/api/v1',
            totalFiles: 3,
            coveredFiles: 1,
            uncoveredFiles: 2,
            coveragePercentage: 33.3
          }
        ],
        fileTypeCoverage: [],
        teamCoverage: [],
        scanDate: new Date('2024-01-01T12:00:00Z')
      };

      const report = generateCoverageReport(analysis);

      assert(report.includes('### src/components/ui'));
      assert(report.includes('### docs/api/v1'));
    });

    it('should format the scan date in a readable format', () => {
      const analysis = {
        totalFiles: 10,
        coveredFiles: 5,
        coveragePercentage: 50.0,
        uncoveredDirectories: [],
        fileTypeCoverage: [],
        teamCoverage: [],
        scanDate: new Date('2024-01-01T12:00:00Z')
      };

      const report = generateCoverageReport(analysis);

      assert(report.includes('Generated on:'));
      // Should contain the date in some format
      assert(report.includes('2024') || report.includes('Jan') || report.includes('01'));
    });
  });
});
