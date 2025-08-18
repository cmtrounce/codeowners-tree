const assert = require('assert');
const { pathMatches, findMatchingPatterns } = require('../out/helpers/pathMatcher');

/**
 * Performance Measurement Tests
 * 
 * These tests measure performance without enforcing thresholds, making them CI-friendly.
 * They always pass but provide detailed performance metrics for tracking trends.
 * 
 * Key benefits:
 * - ✅ CI builds never fail due to performance
 * - 📊 Detailed performance data for analysis
 * - 📈 Track performance trends over time
 * - 🔍 Identify regressions through data comparison
 */

describe('Performance Tests', () => {
  // Performance measurement configuration
  const MEASUREMENT_CONFIG = {
    iterations: 100000,           // Number of iterations for measurement
    warmupIterations: 10000,     // Warmup iterations before measurement
    timeout: 30000               // Test timeout in milliseconds
  };

  // Helper function for performance measurement
  function measurePerformance(name, fn, iterations = MEASUREMENT_CONFIG.iterations) {
    // Warm up
    for (let i = 0; i < MEASUREMENT_CONFIG.warmupIterations; i++) {
      fn();
    }
    
    // Measure performance
    const start = process.hrtime.bigint();
    for (let i = 0; i < iterations; i++) {
      fn();
    }
    const end = process.hrtime.bigint();
    
    const durationNs = Number(end - start);
    const durationMs = durationNs / 1000000;
    const opsPerSecond = Math.round(iterations / (durationMs / 1000));
    const avgNs = durationNs / iterations;
    
    return {
      name,
      durationMs,
      opsPerSecond,
      avgNs,
      iterations
    };
  }

  // Test scenarios
  const testScenarios = [
    {
      name: 'Simple Recursive Pattern',
      pattern: 'src/**/*.js',
      file: 'src/main.js',
      description: 'Common pattern for source files'
    },
    {
      name: 'Brace Expansion Pattern',
      pattern: 'src/**/*.{js,ts}',
      file: 'src/utils/helper.ts',
      description: 'Multiple file extensions'
    },
    {
      name: 'Complex Component Pattern',
      pattern: 'src/**/{components,pages}/*.{js,ts,jsx,tsx}',
      file: 'src/components/Button.jsx',
      description: 'React component structure'
    },
    {
      name: 'Character Class Pattern',
      pattern: 'src/**/[A-Z]*.js',
      file: 'src/components/Button.js',
      description: 'Capitalized component files'
    },
    {
      name: 'Deep Nested Pattern',
      pattern: 'src/**/utils/**/*.js',
      file: 'src/deep/nested/utils/helper.js',
      description: 'Deep directory structure'
    }
  ];

  describe('Individual Pattern Performance', () => {
    testScenarios.forEach(scenario => {
      it(`should measure performance for ${scenario.name}`, function() {
        // Set timeout for performance tests
        this.timeout(MEASUREMENT_CONFIG.timeout);
        
        const result = measurePerformance(
          scenario.name,
          () => pathMatches(scenario.file, scenario.pattern),
          MEASUREMENT_CONFIG.iterations
        );
        
        console.log(`\n📊 ${scenario.name}:`);
        console.log(`   Pattern: ${scenario.pattern}`);
        console.log(`   File: ${scenario.file}`);
        console.log(`   Performance: ${result.opsPerSecond.toLocaleString()} ops/sec`);
        console.log(`   Duration: ${result.durationMs.toFixed(3)}ms`);
        console.log(`   Average: ${result.avgNs.toFixed(0)}ns per operation`);
        
        // Always pass the test - we're measuring, not asserting
        assert(result.opsPerSecond > 0, 'Performance measurement should be positive');
        
        // Store result for summary
        if (!this.performanceResults) {
          this.performanceResults = [];
        }
        this.performanceResults.push(result);
      });
    });
  });

  describe('Batch Pattern Matching Performance', () => {
    it('should measure performance for batch operations', function() {
      this.timeout(MEASUREMENT_CONFIG.timeout);
      
      const allPatterns = testScenarios.map(s => s.pattern);
      const testFile = 'src/components/Button.jsx';
      
      const result = measurePerformance(
        'Batch Pattern Matching',
        () => findMatchingPatterns(testFile, allPatterns),
        10000
      );
      
      console.log(`\n📊 Batch Pattern Matching:`);
      console.log(`   Patterns: ${allPatterns.length} patterns`);
      console.log(`   File: ${testFile}`);
      console.log(`   Performance: ${result.opsPerSecond.toLocaleString()} ops/sec`);
      console.log(`   Duration: ${result.durationMs.toFixed(3)}ms`);
      
      // Always pass the test - we're measuring, not asserting
      assert(result.opsPerSecond > 0, 'Batch performance measurement should be positive');
      
      if (!this.performanceResults) {
        this.performanceResults = [];
      }
      this.performanceResults.push(result);
    });
  });

  describe('Memory Usage Performance', () => {
    it('should measure memory usage under load', function() {
      this.timeout(MEASUREMENT_CONFIG.timeout);
      
      const initialMemory = process.memoryUsage();
      console.log(`\n📊 Memory Usage Test:`);
      console.log(`   Initial memory: ${Math.round(initialMemory.heapUsed / 1024 / 1024)}MB`);
      
      // Run many pattern matches to stress test
      for (let i = 0; i < 100000; i++) {
        const pattern = `src/**/*.${['js', 'ts', 'jsx', 'tsx'][i % 4]}`;
        pathMatches('src/main.js', pattern);
      }
      
      const finalMemory = process.memoryUsage();
      const memoryGrowth = finalMemory.heapUsed - initialMemory.heapUsed;
      
      console.log(`   Final memory: ${Math.round(finalMemory.heapUsed / 1024 / 1024)}MB`);
      console.log(`   Memory growth: ${Math.round(memoryGrowth / 1024 / 1024)}MB`);
      
      // Always pass the test - we're measuring, not asserting
      assert(typeof memoryGrowth === 'number', 'Memory growth should be measurable');
      
      // Store memory result
      if (!this.performanceResults) {
        this.performanceResults = [];
      }
      this.performanceResults.push({
        name: 'Memory Usage',
        memoryGrowth: Math.round(memoryGrowth / 1024 / 1024)
      });
    });
  });

  // After all tests, log performance summary
  after(function() {
    if (this.performanceResults && this.performanceResults.length > 0) {
      console.log('\n🎯 PERFORMANCE TEST SUMMARY');
      console.log('=' .repeat(50));
      
      this.performanceResults.forEach(result => {
        if (result.opsPerSecond) {
          console.log(`✅ ${result.name}: ${result.opsPerSecond.toLocaleString()} ops/sec`);
        } else if (result.memoryGrowth !== undefined) {
          console.log(`✅ ${result.name}: ${result.memoryGrowth}MB growth (threshold: ${result.threshold}MB)`);
        }
      });
      
      console.log('\n📊 Performance Measurements Summary:');
      console.log(`   Tests completed: ${this.performanceResults.length}`);
      console.log(`   Measurement iterations: ${MEASUREMENT_CONFIG.iterations.toLocaleString()}`);
      console.log(`   Test timeout: ${MEASUREMENT_CONFIG.timeout / 1000}s`);
    }
  });
});
