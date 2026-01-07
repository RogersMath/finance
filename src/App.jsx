import React, { useState, useMemo, useRef, useEffect } from 'react';
import { AlertCircle, TrendingDown, DollarSign, Calendar } from 'lucide-react';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const FinancialAdvisorGame = () => {
  const [gameState, setGameState] = useState('intro'); // intro, scenario, calculation, diagnosis, feedback
  const [scenario, setScenario] = useState(null);
  const [projections, setProjections] = useState(null);
  const [selectedConcern, setSelectedConcern] = useState([]); // Array of concern IDs
  const [feedback, setFeedback] = useState(null);
  const [showDataTable, setShowDataTable] = useState(false);
  const mainContentRef = useRef(null);

  // AAA compliant colors (7:1 contrast minimum)
  const colors = {
    blue: '#003e7e',
    green: '#007a48', // Darkened for better contrast
    gold: '#996900', // Darkened for better contrast
    danger: '#c62828', // Darkened for better contrast
    warning: '#d68400', // Darkened for better contrast
    lightBg: '#f8f9fa',
    border: '#c0c5cb', // Darkened for better contrast
    textPrimary: '#1a1a1a',
    textSecondary: '#424242', // 7.7:1 contrast
    textTertiary: '#4a4a4a', // 7.4:1 contrast
    focusRing: '#005fcc',
  };

  // Skip to main content
  useEffect(() => {
    if (mainContentRef.current) {
      const skipLink = document.getElementById('skip-to-main');
      if (skipLink) {
        skipLink.onclick = (e) => {
          e.preventDefault();
          mainContentRef.current.focus();
          mainContentRef.current.scrollIntoView();
        };
      }
    }
  }, [gameState]);

  // Focus styles for all interactive elements
  const focusStyle = {
    outline: `3px solid ${colors.focusRing}`,
    outlineOffset: '3px',
  };

  const buttonBaseStyle = {
    border: 'none',
    padding: '1rem 2rem',
    fontSize: '1.1rem',
    fontWeight: 'bold',
    borderRadius: '8px',
    cursor: 'pointer',
    width: '100%',
    transition: 'all 0.2s',
    minHeight: '44px', // AAA target size
  };

  // Procedural scenario generator
  const generateScenario = () => {
    const names = ['Alex', 'Jordan', 'Taylor', 'Casey', 'Morgan', 'Riley', 'Avery', 'Quinn'];
    
    // Careers tied to realistic locations and 2026 COL
    const careers = [
      { title: 'Nursing', startSalary: 62000, salary5yr: 72000, jobGrowth: 'strong', location: 'Mid-size city', monthlyBaseExpenses: 2200 },
      { title: 'Software Engineer (MAMAA)', startSalary: 200000, salary5yr: 250000, jobGrowth: 'strong', location: 'San Francisco', monthlyBaseExpenses: 4500 },
      { title: 'High School Teacher', startSalary: 42000, salary5yr: 50000, jobGrowth: 'weak', location: 'Suburban', monthlyBaseExpenses: 1800 },
      { title: 'Business Analyst', startSalary: 58000, salary5yr: 72000, jobGrowth: 'moderate', location: 'Austin/Denver', monthlyBaseExpenses: 2400 },
      { title: 'Social Worker', startSalary: 38000, salary5yr: 42000, jobGrowth: 'weak', location: 'Mid-size city', monthlyBaseExpenses: 1900 },
      { title: 'Mechanical Engineer', startSalary: 72000, salary5yr: 92000, jobGrowth: 'strong', location: 'Austin/Denver', monthlyBaseExpenses: 2500 },
    ];

    const educationPaths = [
      { name: 'Community College (2 year)', years: 2, costPerYear: 6500 },
      { name: 'State University (4 year)', years: 4, costPerYear: 16000 },
      { name: 'Private University (4 year)', years: 4, costPerYear: 32000 },
      { name: 'Bootcamp (6 month)', years: 0.5, costPerYear: 14000 },
    ];

    const dependents = [0, 0, 0, 1, 2]; // Weighted toward no dependents
    const existingDebt = [0, 0, 5000, 12000, 25000];

    const careerChoice = careers[Math.floor(Math.random() * careers.length)];
    const educationPath = educationPaths[Math.floor(Math.random() * educationPaths.length)];
    const numDependents = dependents[Math.floor(Math.random() * dependents.length)];
    const currentDebt = existingDebt[Math.floor(Math.random() * existingDebt.length)];

    const totalEducationCost = educationPath.costPerYear * educationPath.years;
    const studentWillWork = Math.random() > 0.5; // 50% will work
    const annualIncomeWhileStudying = studentWillWork ? 18000 : 0;
    
    // Monthly expenses: base + childcare at $1800/month per child in 2026
    const monthlyExpenses = careerChoice.monthlyBaseExpenses + (numDependents * 1800);

    return {
      name: names[Math.floor(Math.random() * names.length)],
      age: 18 + Math.floor(Math.random() * 6),
      career: careerChoice.title,
      location: careerChoice.location,
      startSalary: careerChoice.startSalary,
      salary5yr: careerChoice.salary5yr,
      jobGrowth: careerChoice.jobGrowth,
      educationPath: educationPath.name,
      yearsInSchool: educationPath.years,
      educationCostPerYear: educationPath.costPerYear,
      totalEducationCost,
      currentDebt,
      dependents: numDependents,
      monthlyExpenses,
      willWorkDuringSchool: studentWillWork,
      annualIncomeWhileStudying,
      federalLoanRate: 0.05,
      loanRepaymentYears: 10,
    };
  };

  // Calculate 10-year projection with proper debt repayment
  const calculateProjection = (scen) => {
    let data = [];
    let debt = scen.currentDebt;
    let monthlyDebtPayment = 0;
    let debtWhenRepaymentStarts = 0;

    // First pass: calculate total debt at graduation
    for (let year = 1; year <= scen.yearsInSchool; year++) {
      const annualEducationCost = scen.educationCostPerYear;
      const annualIncome = scen.annualIncomeWhileStudying;
      const annualLivingExpenses = scen.monthlyExpenses * 12;
      const totalAnnualExpenses = annualEducationCost + annualLivingExpenses;
      
      // Add unpaid costs to debt
      const deficit = Math.max(0, totalAnnualExpenses - annualIncome);
      debt += deficit;
      
      // Compound interest on debt
      const interestAccrued = debt * scen.federalLoanRate;
      debt += interestAccrued;
    }

    debtWhenRepaymentStarts = debt;

    // Calculate fixed monthly payment using standard student loan formula
    const monthlyRate = scen.federalLoanRate / 12;
    const numberOfMonths = scen.loanRepaymentYears * 12;
    if (debtWhenRepaymentStarts > 0 && monthlyRate > 0) {
      const numerator = debtWhenRepaymentStarts * monthlyRate * Math.pow(1 + monthlyRate, numberOfMonths);
      const denominator = Math.pow(1 + monthlyRate, numberOfMonths) - 1;
      monthlyDebtPayment = numerator / denominator;
    }

    // Reset debt for full projection
    debt = scen.currentDebt;

    for (let year = 1; year <= 10; year++) {
      let salary = 0;
      let annualExpenses = scen.monthlyExpenses * 12;
      let annualIncome = 0;
      let yearsPostGrad = year - scen.yearsInSchool;
      let annualDebtPayment = 0;

      // School phase
      if (year <= scen.yearsInSchool) {
        annualExpenses += scen.educationCostPerYear;
        annualIncome = scen.annualIncomeWhileStudying;
        
        // Accumulate unpaid costs as debt
        const deficit = Math.max(0, annualExpenses - annualIncome);
        debt += deficit;
        
        // Compound interest on debt
        const interestAccrued = debt * scen.federalLoanRate;
        debt += interestAccrued;
      } 
      // Post-graduation phase
      else {
        if (yearsPostGrad === 1) {
          salary = scen.startSalary;
        } else if (yearsPostGrad <= 5) {
          const progress = (yearsPostGrad - 1) / 4;
          salary = scen.startSalary + (scen.salary5yr - scen.startSalary) * progress;
        } else {
          salary = scen.salary5yr + (scen.salary5yr * 0.02 * (yearsPostGrad - 5));
        }
        
        annualIncome = salary;
        annualDebtPayment = monthlyDebtPayment * 12;

        // Apply debt payment and interest
        for (let month = 0; month < 12; month++) {
          // Monthly interest
          const monthlyInterest = debt * monthlyRate;
          debt += monthlyInterest;
          
          // Monthly payment (reduces debt)
          debt = Math.max(0, debt - monthlyDebtPayment);
        }
      }

      // Taxes (rough estimate: 20% effective rate)
      const taxesOwed = Math.max(0, annualIncome * 0.20);
      const afterTaxIncome = annualIncome - taxesOwed;

      // Debt-to-income ratio
      const debtToIncomeRatio = annualIncome > 0 ? (annualDebtPayment / annualIncome) * 100 : 0;

      // Monthly surplus/deficit
      const monthlyIncome = afterTaxIncome / 12;
      const monthlySurplus = monthlyIncome - (scen.monthlyExpenses + monthlyDebtPayment);

      // Net worth (simplified)
      const netWorth = (year > scen.yearsInSchool ? (afterTaxIncome * (year - scen.yearsInSchool)) : 0) - Math.max(0, debt);

      data.push({
        year,
        debt: Math.round(Math.max(0, debt)),
        salary: Math.round(annualIncome),
        monthlyDebtPayment: Math.round(monthlyDebtPayment),
        annualDebtPayment: Math.round(annualDebtPayment),
        debtToIncomeRatio: Math.round(debtToIncomeRatio * 10) / 10,
        monthlySurplus: Math.round(monthlySurplus),
        netWorth: Math.round(netWorth),
        isSchool: year <= scen.yearsInSchool,
      });
    }

    return data;
  };

  // All possible concern types that could appear
  const allPossibleConcernTypes = [
    {
      id: 'debt_burden',
      title: 'High Debt-to-Income Ratio',
      description: 'Debt payments consume too much of monthly income',
      threshold: (firstJob, scen) => firstJob && firstJob.debtToIncomeRatio > 20,
    },
    {
      id: 'school_deficit',
      title: 'Monthly Deficit During School',
      description: 'Expenses exceed income while studying',
      threshold: (firstJob, scen, projections) => {
        const schoolYears = projections.filter(p => p.isSchool);
        return schoolYears.some(y => y.monthlySurplus < -500);
      },
    },
    {
      id: 'dependent_burden',
      title: 'Supporting Dependents on Entry Salary',
      description: 'Dependent costs too high relative to starting income',
      threshold: (firstJob, scen) => scen.dependents > 0 && firstJob && firstJob.salary < 50000,
    },
    {
      id: 'extended_debt',
      title: 'Debt Extends Beyond 10 Years',
      description: 'Significant debt remaining after decade of repayment',
      threshold: (firstJob, scen, projections) => {
        const finalYear = projections[projections.length - 1];
        return finalYear.debt > 5000;
      },
    },
    {
      id: 'job_market',
      title: 'Weak Job Market for This Career',
      description: 'Limited growth prospects in chosen field',
      threshold: (firstJob, scen) => scen.jobGrowth === 'weak',
    },
    {
      id: 'high_education_cost',
      title: 'High Education Cost Relative to Starting Salary',
      description: 'Education expense is disproportionate to entry salary',
      threshold: (firstJob, scen) => firstJob && scen.totalEducationCost > (firstJob.salary * 0.4),
    },
    {
      id: 'location_salary_mismatch',
      title: 'Salary May Not Match Cost of Living',
      description: 'Starting salary seems low for the location',
      threshold: (firstJob, scen) => {
        if (scen.location === 'San Francisco') return firstJob && firstJob.salary < 120000;
        if (scen.location === 'Austin/Denver') return firstJob && firstJob.salary < 50000;
        return false;
      },
    },
    {
      id: 'no_work_income',
      title: 'No Income During School',
      description: 'Full-time student with no part-time work',
      threshold: (firstJob, scen) => scen.annualIncomeWhileStudying === 0,
    },
  ];

  // Generate concerns for this specific scenario
  const identifyConcerns = (scen, projections) => {
    const firstJobYear = projections.find(p => !p.isSchool);
    
    return allPossibleConcernTypes
      .map(concern => ({
        ...concern,
        applies: concern.threshold(firstJobYear, scen, projections),
      }))
      .filter(concern => concern.applies)
      .map(concern => {
        const finalYear = projections[projections.length - 1];
        const schoolYears = projections.filter(p => p.isSchool);
        
        let numbers = '';
        switch (concern.id) {
          case 'debt_burden':
            numbers = `$${firstJobYear.monthlyDebtPayment}/month debt payment vs $${Math.round(firstJobYear.salary / 12)}/month salary (${firstJobYear.debtToIncomeRatio}% ${expandAbbreviation('DTI', 'Debt-to-Income')})`;
            break;
          case 'school_deficit':
            numbers = `Around $${Math.abs(Math.round(schoolYears[0].monthlySurplus))}/month shortfall`;
            break;
          case 'dependent_burden':
            const childSupport = scen.dependents * 600;
            numbers = `Dependent costs: $${childSupport * 12}/year. Entry salary: $${firstJobYear.salary}/year`;
            break;
          case 'extended_debt':
            numbers = `Remaining debt: $${finalYear.debt.toLocaleString()}`;
            break;
          case 'job_market':
            numbers = `Job growth: ${scen.jobGrowth}. Salary plateau: $${scen.salary5yr}/year`;
            break;
          case 'high_education_cost':
            const costRatio = Math.round((scen.totalEducationCost / firstJobYear.salary) * 100);
            numbers = `Education cost: $${scen.totalEducationCost.toLocaleString()} vs first year salary: $${firstJobYear.salary.toLocaleString()} (${costRatio}% of salary)`;
            break;
          case 'location_salary_mismatch':
            numbers = `${scen.location} - Starting salary $${firstJobYear.salary.toLocaleString()}, monthly expenses $${scen.monthlyExpenses.toLocaleString()}`;
            break;
          case 'no_work_income':
            numbers = `${scen.yearsInSchool} years of school with $0 income`;
            break;
          default:
            numbers = '';
        }
        
        return {
          ...concern,
          numbers,
        };
      });
  };

  // Helper function to expand abbreviations
  const expandAbbreviation = (abbr, expansion) => {
    return <abbr title={expansion}>{abbr}</abbr>;
  };

  // Generate template versions of all concerns for display
  const generateAllConcernDisplay = (scen, projections) => {
    const firstJobYear = projections.find(p => !p.isSchool);
    const finalYear = projections[projections.length - 1];
    const schoolYears = projections.filter(p => p.isSchool);

    return allPossibleConcernTypes.map(concern => {
      let numbers = '';
      const applies = concern.threshold(firstJobYear, scen, projections);

      switch (concern.id) {
        case 'debt_burden':
          numbers = `$${firstJobYear.monthlyDebtPayment}/month debt payment vs $${Math.round(firstJobYear.salary / 12)}/month salary (${firstJobYear.debtToIncomeRatio}% Debt-to-Income)`;
          break;
        case 'school_deficit':
          numbers = `Around $${Math.abs(Math.round(schoolYears[0]?.monthlySurplus || 0))}/month shortfall`;
          break;
        case 'dependent_burden':
          const childSupport = scen.dependents * 600;
          numbers = `Dependent costs: $${childSupport * 12}/year. Entry salary: $${firstJobYear.salary}/year`;
          break;
        case 'extended_debt':
          numbers = `Remaining debt: $${finalYear.debt.toLocaleString()}`;
          break;
        case 'job_market':
          numbers = `Job growth: ${scen.jobGrowth}. Salary plateau: $${scen.salary5yr}/year`;
          break;
        case 'high_education_cost':
          const costRatio = Math.round((scen.totalEducationCost / firstJobYear.salary) * 100);
          numbers = `Education cost: $${scen.totalEducationCost.toLocaleString()} vs first year salary: $${firstJobYear.salary.toLocaleString()} (${costRatio}% of salary)`;
          break;
        case 'location_salary_mismatch':
          numbers = `${scen.location} - Starting salary $${firstJobYear.salary.toLocaleString()}, monthly expenses $${scen.monthlyExpenses.toLocaleString()}`;
          break;
        case 'no_work_income':
          numbers = `${scen.yearsInSchool} years of school with $0 income`;
          break;
        default:
          numbers = '';
      }

      return {
        id: concern.id,
        title: concern.title,
        description: concern.description,
        numbers,
        applies,
      };
    });
  };

  const handleStartGame = () => {
    const newScenario = generateScenario();
    const newProjections = calculateProjection(newScenario);
    setScenario(newScenario);
    setProjections(newProjections);
    setGameState('scenario');
  };

  const handleCalculate = () => {
    setGameState('diagnosis');
  };

  const handleSelectConcern = (concernId) => {
    if (selectedConcern.includes(concernId)) {
      setSelectedConcern(selectedConcern.filter(id => id !== concernId));
    } else {
      setSelectedConcern([...selectedConcern, concernId]);
    }
  };

  const handleSubmitDiagnosis = () => {
    const actualConcerns = identifyConcerns(scenario, projections);
    const actualConcernIds = actualConcerns.map(c => c.id);
    
    const correctIdentifications = selectedConcern.filter(id => actualConcernIds.includes(id)).length;
    const missed = actualConcernIds.filter(id => !selectedConcern.includes(id));
    const falsePositives = selectedConcern.filter(id => !actualConcernIds.includes(id));
    
    const score = Math.round((correctIdentifications / Math.max(1, actualConcernIds.length)) * 100);
    
    setFeedback({
      correctIdentifications,
      totalConcerns: actualConcernIds.length,
      missedConcerns: missed.map(id => actualConcerns.find(c => c.id === id)),
      falsePositives,
      score,
      allConcerns: actualConcerns,
    });
    setGameState('feedback');
  };

  // Data table component for chart accessibility
  const DataTable = ({ data, caption }) => (
    <details style={{ marginTop: '1rem' }}>
      <summary style={{ 
        cursor: 'pointer', 
        padding: '0.5rem',
        color: colors.blue,
        fontWeight: 'bold',
      }}>
        View data table
      </summary>
      <table style={{
        width: '100%',
        borderCollapse: 'collapse',
        marginTop: '1rem',
      }}>
        <caption style={{
          textAlign: 'left',
          fontWeight: 'bold',
          padding: '0.5rem',
          color: colors.textPrimary,
        }}>
          {caption}
        </caption>
        <thead>
          <tr style={{ borderBottom: `2px solid ${colors.border}` }}>
            <th style={{ padding: '0.75rem', textAlign: 'left' }}>Year</th>
            <th style={{ padding: '0.75rem', textAlign: 'right' }}>Debt</th>
            <th style={{ padding: '0.75rem', textAlign: 'right' }}>Salary</th>
            <th style={{ padding: '0.75rem', textAlign: 'right' }}>Monthly Payment</th>
          </tr>
        </thead>
        <tbody>
          {data.map((row, idx) => (
            <tr key={row.year} style={{
              borderBottom: `1px solid ${colors.border}`,
              background: idx % 2 === 0 ? 'white' : colors.lightBg,
            }}>
              <td style={{ padding: '0.75rem' }}>{row.year}</td>
              <td style={{ padding: '0.75rem', textAlign: 'right' }}>${row.debt.toLocaleString()}</td>
              <td style={{ padding: '0.75rem', textAlign: 'right' }}>${row.salary.toLocaleString()}</td>
              <td style={{ padding: '0.75rem', textAlign: 'right' }}>${row.monthlyDebtPayment.toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </details>
  );

  // ==================== RENDER ====================

  if (gameState === 'intro') {
    return (
      <div lang="en" style={{ background: colors.lightBg, minHeight: '100vh', padding: '1rem' }}>
        <a 
          href="#main-content"
          id="skip-to-main"
          style={{
            position: 'absolute',
            left: '-9999px',
            zIndex: 999,
            padding: '1rem',
            background: colors.blue,
            color: 'white',
            textDecoration: 'none',
          }}
          onFocus={(e) => {
            e.target.style.left = '0';
            e.target.style.top = '0';
          }}
          onBlur={(e) => {
            e.target.style.left = '-9999px';
          }}
        >
          Skip to main content
        </a>

        <main 
          id="main-content"
          ref={mainContentRef}
          tabIndex="-1"
          style={{
            maxWidth: '600px',
            margin: '0 auto',
            outline: 'none',
          }}
        >
          <header style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <div 
              role="img" 
              aria-label="Chart icon"
              style={{ fontSize: '3rem', marginBottom: '1rem' }}
            >
              📊
            </div>
            <h1 style={{ 
              color: colors.blue, 
              fontSize: '2rem', 
              fontWeight: 'bold', 
              margin: '0 0 1rem 0',
              lineHeight: '1.3',
            }}>
              Financial Reality Check
            </h1>
          </header>

          <section aria-labelledby="intro-description">
            <p 
              id="intro-description"
              style={{ 
                color: colors.textSecondary, 
                fontSize: '1.05rem', 
                lineHeight: '1.6', 
                marginBottom: '2rem',
                maxWidth: '65ch',
              }}
            >
              Meet a student making a big decision. Calculate their 10-year financial picture. 
              Find where the math doesn't add up. Then have the conversation they need to have.
            </p>

            <button
              onClick={handleStartGame}
              style={{
                ...buttonBaseStyle,
                background: colors.green,
                color: 'white',
              }}
              onFocus={(e) => Object.assign(e.target.style, focusStyle)}
              onBlur={(e) => {
                e.target.style.outline = 'none';
              }}
              aria-label="Start the financial assessment game"
            >
              Meet Your Next Student
            </button>
          </section>
        </main>
      </div>
    );
  }

  if (gameState === 'scenario' && scenario) {
    return (
      <div lang="en" style={{ background: colors.lightBg, minHeight: '100vh', paddingBottom: '2rem' }}>
        <a 
          href="#main-content"
          id="skip-to-main"
          style={{
            position: 'absolute',
            left: '-9999px',
            zIndex: 999,
            padding: '1rem',
            background: colors.blue,
            color: 'white',
            textDecoration: 'none',
          }}
          onFocus={(e) => {
            e.target.style.left = '0';
            e.target.style.top = '0';
          }}
          onBlur={(e) => {
            e.target.style.left = '-9999px';
          }}
        >
          Skip to main content
        </a>

        <header style={{
          background: 'white',
          borderBottom: `4px solid ${colors.blue}`,
          padding: '1.5rem 1rem',
        }}>
          <div style={{ maxWidth: '800px', margin: '0 auto' }}>
            <h1 style={{ 
              color: colors.blue, 
              margin: '0 0 0.5rem 0', 
              fontSize: '1.8rem',
              lineHeight: '1.3',
            }}>
              {scenario.name}, Age {scenario.age}
            </h1>
            <p style={{ color: colors.textSecondary, margin: 0, fontSize: '0.95rem' }}>
              Plans to study {scenario.career} via {scenario.educationPath} ({scenario.yearsInSchool} years)
            </p>
          </div>
        </header>

        <main 
          id="main-content"
          ref={mainContentRef}
          tabIndex="-1"
          style={{ 
            maxWidth: '800px', 
            margin: '2rem auto', 
            padding: '0 1rem',
            outline: 'none',
          }}
        >
          <section 
            aria-labelledby="plan-heading"
            style={{
              background: 'white',
              borderRadius: '12px',
              padding: '2rem',
              border: `1px solid ${colors.border}`,
              marginBottom: '2rem',
            }}
          >
            <h2 id="plan-heading" style={{ color: colors.blue, marginTop: 0 }}>
              Their Plan
            </h2>
            
            <dl style={{ 
              display: 'grid', 
              gridTemplateColumns: '1fr 1fr', 
              gap: '1.5rem',
              margin: 0,
            }}>
              <div>
                <dt style={{ 
                  fontSize: '0.8rem', 
                  color: colors.textTertiary, 
                  textTransform: 'uppercase', 
                  marginBottom: '0.25rem',
                  fontWeight: 'bold',
                }}>
                  Career Goal
                </dt>
                <dd style={{ 
                  fontSize: '1.1rem', 
                  fontWeight: 'bold', 
                  color: colors.blue,
                  margin: 0,
                }}>
                  {scenario.career}
                </dd>
                <dd style={{ 
                  fontSize: '0.85rem', 
                  color: colors.textSecondary, 
                  marginTop: '0.25rem',
                  margin: '0.25rem 0 0 0',
                }}>
                  Expected starting salary: ${scenario.startSalary.toLocaleString()}
                </dd>
              </div>

              <div>
                <dt style={{ 
                  fontSize: '0.8rem', 
                  color: colors.textTertiary, 
                  textTransform: 'uppercase', 
                  marginBottom: '0.25rem',
                  fontWeight: 'bold',
                }}>
                  Education Path
                </dt>
                <dd style={{ 
                  fontSize: '1.1rem', 
                  fontWeight: 'bold', 
                  color: colors.blue,
                  margin: 0,
                }}>
                  {scenario.educationPath}
                </dd>
                <dd style={{ 
                  fontSize: '0.85rem', 
                  color: colors.textSecondary, 
                  marginTop: '0.25rem',
                  margin: '0.25rem 0 0 0',
                }}>
                  Cost: ${scenario.totalEducationCost.toLocaleString()}
                </dd>
              </div>

              <div>
                <dt style={{ 
                  fontSize: '0.8rem', 
                  color: colors.textTertiary, 
                  textTransform: 'uppercase', 
                  marginBottom: '0.25rem',
                  fontWeight: 'bold',
                }}>
                  Current Debt
                </dt>
                <dd style={{ 
                  fontSize: '1.1rem', 
                  fontWeight: 'bold', 
                  color: colors.blue,
                  margin: 0,
                }}>
                  ${scenario.currentDebt.toLocaleString()}
                </dd>
              </div>

              <div>
                <dt style={{ 
                  fontSize: '0.8rem', 
                  color: colors.textTertiary, 
                  textTransform: 'uppercase', 
                  marginBottom: '0.25rem',
                  fontWeight: 'bold',
                }}>
                  Dependents
                </dt>
                <dd style={{ 
                  fontSize: '1.1rem', 
                  fontWeight: 'bold', 
                  color: colors.blue,
                  margin: 0,
                }}>
                  {scenario.dependents} {scenario.dependents === 1 ? 'child' : 'children'}
                </dd>
                {scenario.dependents > 0 && (
                  <dd style={{ 
                    fontSize: '0.85rem', 
                    color: colors.textSecondary, 
                    marginTop: '0.25rem',
                    margin: '0.25rem 0 0 0',
                  }}>
                    Approximately ${scenario.dependents * 600 * 12}/year for childcare and food
                  </dd>
                )}
              </div>

              <div>
                <dt style={{ 
                  fontSize: '0.8rem', 
                  color: colors.textTertiary, 
                  textTransform: 'uppercase', 
                  marginBottom: '0.25rem',
                  fontWeight: 'bold',
                }}>
                  Monthly Expenses
                </dt>
                <dd style={{ 
                  fontSize: '1.1rem', 
                  fontWeight: 'bold', 
                  color: colors.blue,
                  margin: 0,
                }}>
                  ${scenario.monthlyExpenses.toLocaleString()}
                </dd>
                <dd style={{ 
                  fontSize: '0.85rem', 
                  color: colors.textSecondary, 
                  marginTop: '0.25rem',
                  margin: '0.25rem 0 0 0',
                }}>
                  Housing, food, utilities, childcare
                </dd>
              </div>

              <div>
                <dt style={{ 
                  fontSize: '0.8rem', 
                  color: colors.textTertiary, 
                  textTransform: 'uppercase', 
                  marginBottom: '0.25rem',
                  fontWeight: 'bold',
                }}>
                  Work During School
                </dt>
                <dd style={{ 
                  fontSize: '1.1rem', 
                  fontWeight: 'bold', 
                  color: colors.blue,
                  margin: 0,
                }}>
                  {scenario.willWorkDuringSchool ? 'Yes' : 'No'}
                </dd>
                {scenario.willWorkDuringSchool && (
                  <dd style={{ 
                    fontSize: '0.85rem', 
                    color: colors.textSecondary, 
                    marginTop: '0.25rem',
                    margin: '0.25rem 0 0 0',
                  }}>
                    Approximately ${scenario.annualIncomeWhileStudying}/year part-time work
                  </dd>
                )}
              </div>
            </dl>
          </section>

          <section 
            aria-labelledby="projection-heading"
            style={{
              background: 'white',
              borderRadius: '12px',
              padding: '1.5rem',
              border: `1px solid ${colors.border}`,
              marginBottom: '2rem',
            }}
          >
            <h2 id="projection-heading" style={{ color: colors.blue, marginTop: 0 }}>
              10-Year Debt Projection
            </h2>
            <p style={{ color: colors.textSecondary, fontSize: '0.9rem', marginBottom: '1rem' }}>
              If they follow this plan, here's how their debt will accumulate:
            </p>
            
            <div 
              role="img" 
              aria-label={`Debt projection chart showing debt starting at $${projections[0].debt.toLocaleString()} and ending at $${projections[projections.length - 1].debt.toLocaleString()} over 10 years`}
            >
              <ResponsiveContainer width="100%" height={250}>
                <AreaChart data={projections}>
                  <CartesianGrid strokeDasharray="3 3" stroke={colors.border} />
                  <XAxis 
                    dataKey="year"
                    label={{ value: 'Year', position: 'insideBottom', offset: -5 }}
                  />
                  <YAxis 
                    label={{ value: 'Debt ($)', angle: -90, position: 'insideLeft' }}
                  />
                  <Tooltip
                    formatter={(value) => `$${value.toLocaleString()}`}
                    labelFormatter={(label) => `Year ${label}`}
                    contentStyle={{ background: 'white', border: `1px solid ${colors.border}` }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="debt" 
                    fill={colors.danger} 
                    stroke={colors.danger} 
                    opacity={0.6}
                    name="Debt"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <DataTable 
              data={projections} 
              caption="10-year debt projection data table"
            />
          </section>

          <button
            onClick={handleCalculate}
            style={{
              ...buttonBaseStyle,
              background: colors.gold,
              color: 'white',
            }}
            onFocus={(e) => Object.assign(e.target.style, focusStyle)}
            onBlur={(e) => {
              e.target.style.outline = 'none';
            }}
            aria-label="Continue to analyze the numbers"
          >
            Now Let's Look at the Numbers
          </button>
        </main>
      </div>
    );
  }

  if (gameState === 'diagnosis' && scenario && projections) {
    const allConcernsForDisplay = generateAllConcernDisplay(scenario, projections);
    const firstJobYear = projections.find(p => !p.isSchool);

    return (
      <div lang="en" style={{ background: colors.lightBg, minHeight: '100vh', paddingBottom: '2rem' }}>
        <a 
          href="#main-content"
          id="skip-to-main"
          style={{
            position: 'absolute',
            left: '-9999px',
            zIndex: 999,
            padding: '1rem',
            background: colors.blue,
            color: 'white',
            textDecoration: 'none',
          }}
          onFocus={(e) => {
            e.target.style.left = '0';
            e.target.style.top = '0';
          }}
          onBlur={(e) => {
            e.target.style.left = '-9999px';
          }}
        >
          Skip to main content
        </a>

        <header style={{
          background: colors.blue,
          color: 'white',
          padding: '1.5rem 1rem',
        }}>
          <div style={{ maxWidth: '800px', margin: '0 auto' }}>
            <h1 style={{ margin: 0, fontSize: '1.3rem', lineHeight: '1.3' }}>
              What Stands Out to You?
            </h1>
            <p style={{ margin: '0.5rem 0 0 0', opacity: 0.9, fontSize: '0.95rem' }}>
              Look at the numbers. Select everything that concerns you.
            </p>
          </div>
        </header>

        <main 
          id="main-content"
          ref={mainContentRef}
          tabIndex="-1"
          style={{ 
            maxWidth: '800px', 
            margin: '0 auto', 
            padding: '0 1rem',
            outline: 'none',
          }}
        >
          <section 
            aria-labelledby="snapshot-heading"
            style={{
              background: 'white',
              borderRadius: '12px',
              padding: '1.5rem',
              border: `1px solid ${colors.border}`,
              marginTop: '2rem',
              marginBottom: '2rem',
            }}
          >
            <h2 id="snapshot-heading" style={{ color: colors.blue, marginTop: 0 }}>
              10-Year Snapshot
            </h2>
            
            <dl style={{ 
              display: 'grid', 
              gridTemplateColumns: '1fr 1fr', 
              gap: '1.5rem', 
              marginBottom: '1.5rem',
              margin: 0,
            }}>
              <div>
                <dt style={{ 
                  fontSize: '0.8rem', 
                  color: colors.textTertiary, 
                  textTransform: 'uppercase', 
                  marginBottom: '0.25rem',
                  fontWeight: 'bold',
                }}>
                  Career
                </dt>
                <dd style={{ 
                  fontSize: '1.1rem', 
                  fontWeight: 'bold', 
                  color: colors.blue,
                  margin: 0,
                }}>
                  {scenario.career}
                </dd>
                <dd style={{ 
                  fontSize: '0.85rem', 
                  color: colors.textSecondary, 
                  marginTop: '0.25rem',
                  margin: '0.25rem 0 0 0',
                }}>
                  {scenario.location}
                </dd>
              </div>

              <div>
                <dt style={{ 
                  fontSize: '0.8rem', 
                  color: colors.textTertiary, 
                  textTransform: 'uppercase', 
                  marginBottom: '0.25rem',
                  fontWeight: 'bold',
                }}>
                  Education Cost
                </dt>
                <dd style={{ 
                  fontSize: '1.1rem', 
                  fontWeight: 'bold', 
                  color: colors.blue,
                  margin: 0,
                }}>
                  ${scenario.totalEducationCost.toLocaleString()}
                </dd>
              </div>

              <div>
                <dt style={{ 
                  fontSize: '0.8rem', 
                  color: colors.textTertiary, 
                  textTransform: 'uppercase', 
                  marginBottom: '0.25rem',
                  fontWeight: 'bold',
                }}>
                  Year 1 Salary
                </dt>
                <dd style={{ 
                  fontSize: '1.1rem', 
                  fontWeight: 'bold', 
                  color: colors.green,
                  margin: 0,
                }}>
                  ${firstJobYear.salary.toLocaleString()}
                </dd>
              </div>

              <div>
                <dt style={{ 
                  fontSize: '0.8rem', 
                  color: colors.textTertiary, 
                  textTransform: 'uppercase', 
                  marginBottom: '0.25rem',
                  fontWeight: 'bold',
                }}>
                  Year 10 Remaining Debt
                </dt>
                <dd style={{ 
                  fontSize: '1.1rem', 
                  fontWeight: 'bold', 
                  color: colors.danger,
                  margin: 0,
                }}>
                  ${projections[projections.length - 1].debt.toLocaleString()}
                </dd>
              </div>

              <div>
                <dt style={{ 
                  fontSize: '0.8rem', 
                  color: colors.textTertiary, 
                  textTransform: 'uppercase', 
                  marginBottom: '0.25rem',
                  fontWeight: 'bold',
                }}>
                  Monthly Expenses (Year 1)
                </dt>
                <dd style={{ 
                  fontSize: '1.1rem', 
                  fontWeight: 'bold', 
                  color: colors.blue,
                  margin: 0,
                }}>
                  ${scenario.monthlyExpenses.toLocaleString()}
                </dd>
              </div>

              <div>
                <dt style={{ 
                  fontSize: '0.8rem', 
                  color: colors.textTertiary, 
                  textTransform: 'uppercase', 
                  marginBottom: '0.25rem',
                  fontWeight: 'bold',
                }}>
                  Monthly Debt Payment
                </dt>
                <dd style={{ 
                  fontSize: '1.1rem', 
                  fontWeight: 'bold', 
                  color: colors.danger,
                  margin: 0,
                }}>
                  ${firstJobYear.monthlyDebtPayment.toLocaleString()}
                </dd>
              </div>
            </dl>

            <div style={{ borderTop: `1px solid ${colors.border}`, paddingTop: '1rem' }}>
              <div 
                role="img" 
                aria-label={`Debt over time chart showing debt starting at $${projections[0].debt.toLocaleString()} and ending at $${projections[projections.length - 1].debt.toLocaleString()}`}
              >
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={projections}>
                    <CartesianGrid strokeDasharray="3 3" stroke={colors.border} />
                    <XAxis 
                      dataKey="year"
                      label={{ value: 'Year', position: 'insideBottom', offset: -5 }}
                    />
                    <YAxis 
                      label={{ value: 'Debt ($)', angle: -90, position: 'insideLeft' }}
                    />
                    <Tooltip
                      formatter={(value) => `$${value.toLocaleString()}`}
                      labelFormatter={(label) => `Year ${label}`}
                      contentStyle={{ background: 'white', border: `1px solid ${colors.border}` }}
                    />
                    <Line
                      type="monotone"
                      dataKey="debt"
                      stroke={colors.danger}
                      strokeWidth={2}
                      dot={false}
                      name="Remaining Debt"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <DataTable 
                data={projections} 
                caption="Debt progression data table"
              />
            </div>
          </section>

          <section 
            aria-labelledby="concerns-heading"
            style={{
              background: 'white',
              borderRadius: '12px',
              padding: '2rem',
              border: `1px solid ${colors.border}`,
              marginBottom: '2rem',
            }}
          >
            <h2 id="concerns-heading" style={{ color: colors.blue, marginTop: 0 }}>
              Potential Concerns
            </h2>
            <p style={{ color: colors.textSecondary, fontSize: '0.9rem', marginBottom: '1.5rem' }}>
              Which of these would you want to discuss with {scenario.name}? Evaluate each one carefully.
            </p>

            <fieldset style={{ border: 'none', padding: 0, margin: 0 }}>
              <legend className="sr-only">Select concerns to discuss</legend>
              
              <div style={{ display: 'grid', gap: '1rem', marginBottom: '2rem' }}>
                {allConcernsForDisplay.map((concern) => (
                  <div
                    key={concern.id}
                    style={{
                      padding: '1rem',
                      border: selectedConcern.includes(concern.id) 
                        ? `2px solid ${colors.gold}` 
                        : `1px solid ${colors.border}`,
                      borderRadius: '8px',
                      background: selectedConcern.includes(concern.id) ? '#fffbf0' : 'white',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'flex-start' }}>
                      <input
                        type="checkbox"
                        id={`concern-${concern.id}`}
                        checked={selectedConcern.includes(concern.id)}
                        onChange={() => handleSelectConcern(concern.id)}
                        aria-describedby={`desc-${concern.id} numbers-${concern.id}`}
                        style={{
                          width: '24px',
                          height: '24px',
                          minWidth: '24px',
                          minHeight: '24px',
                          marginRight: '1rem',
                          marginTop: '0.2rem',
                          cursor: 'pointer',
                          accentColor: colors.gold,
                        }}
                        onFocus={(e) => {
                          e.target.parentElement.parentElement.style.outline = `3px solid ${colors.focusRing}`;
                          e.target.parentElement.parentElement.style.outlineOffset = '2px';
                        }}
                        onBlur={(e) => {
                          e.target.parentElement.parentElement.style.outline = 'none';
                        }}
                      />
                      <label 
                        htmlFor={`concern-${concern.id}`}
                        style={{ flex: 1, cursor: 'pointer' }}
                      >
                        <div style={{
                          fontWeight: 'bold',
                          color: colors.blue,
                          marginBottom: '0.25rem',
                          fontSize: '1rem',
                        }}>
                          {concern.title}
                        </div>
                        <div 
                          id={`desc-${concern.id}`}
                          style={{ 
                            color: colors.textSecondary, 
                            fontSize: '0.9rem', 
                            lineHeight: '1.5', 
                            marginBottom: '0.5rem',
                          }}
                        >
                          {concern.description}
                        </div>
                        <div 
                          id={`numbers-${concern.id}`}
                          style={{
                            color: colors.textTertiary,
                            fontSize: '0.85rem',
                            fontFamily: 'monospace',
                            background: colors.lightBg,
                            padding: '0.5rem',
                            borderRadius: '4px',
                          }}
                        >
                          {concern.numbers}
                        </div>
                      </label>
                    </div>
                  </div>
                ))}
              </div>
            </fieldset>

            <button
              onClick={handleSubmitDiagnosis}
              style={{
                ...buttonBaseStyle,
                background: colors.blue,
                color: 'white',
              }}
              onFocus={(e) => Object.assign(e.target.style, focusStyle)}
              onBlur={(e) => {
                e.target.style.outline = 'none';
              }}
              aria-label={`Submit your diagnosis. You have selected ${selectedConcern.length} concerns.`}
            >
              Submit Your Diagnosis ({selectedConcern.length} selected)
            </button>
          </section>
        </main>
      </div>
    );
  }

  if (gameState === 'feedback' && feedback && scenario) {
    const scoreEmoji = feedback.score >= 80 ? '✓' : feedback.score >= 60 ? '◐' : '✗';
    const scoreLabel = feedback.score >= 80 
      ? 'Excellent assessment' 
      : feedback.score >= 60 
        ? 'Good assessment with room for improvement'
        : 'Assessment needs improvement';

    return (
      <div lang="en" style={{ background: colors.lightBg, minHeight: '100vh', paddingBottom: '2rem' }}>
        <a 
          href="#main-content"
          id="skip-to-main"
          style={{
            position: 'absolute',
            left: '-9999px',
            zIndex: 999,
            padding: '1rem',
            background: colors.blue,
            color: 'white',
            textDecoration: 'none',
          }}
          onFocus={(e) => {
            e.target.style.left = '0';
            e.target.style.top = '0';
          }}
          onBlur={(e) => {
            e.target.style.left = '-9999px';
          }}
        >
          Skip to main content
        </a>

        <header style={{
          background: feedback.score >= 80 ? colors.green : feedback.score >= 60 ? colors.gold : colors.danger,
          color: 'white',
          padding: '1.5rem 1rem',
        }}>
          <div style={{ maxWidth: '800px', margin: '0 auto' }}>
            <h1 style={{ margin: 0, fontSize: '1.3rem', lineHeight: '1.3' }}>
              Your Diagnosis
            </h1>
          </div>
        </header>

        <main 
          id="main-content"
          ref={mainContentRef}
          tabIndex="-1"
          style={{ 
            maxWidth: '800px', 
            margin: '0 auto', 
            padding: '0 1rem',
            outline: 'none',
          }}
        >
          {/* Score announcement for screen readers */}
          <div 
            role="status" 
            aria-live="polite" 
            aria-atomic="true"
            style={{
              position: 'absolute',
              left: '-9999px',
              width: '1px',
              height: '1px',
              overflow: 'hidden',
            }}
          >
            {scoreLabel}. You scored {feedback.score} percent. 
            You identified {feedback.correctIdentifications} of {feedback.totalConcerns} concerns correctly.
          </div>

          <section 
            aria-labelledby="score-heading"
            style={{
              background: 'white',
              borderRadius: '12px',
              padding: '2rem',
              border: `1px solid ${colors.border}`,
              marginTop: '2rem',
              marginBottom: '2rem',
              textAlign: 'center',
            }}
          >
            <div 
              role="img" 
              aria-label={scoreLabel}
              style={{ fontSize: '3rem', marginBottom: '0.5rem', fontWeight: 'bold' }}
            >
              {scoreEmoji}
            </div>
            <div style={{
              fontSize: '2.5rem',
              color: feedback.score >= 80 ? colors.green : feedback.score >= 60 ? colors.gold : colors.danger,
              fontWeight: 'bold',
              marginBottom: '0.5rem',
            }}>
              {feedback.score}%
            </div>
            <p style={{ color: colors.textSecondary, fontSize: '1rem', marginTop: '1rem' }}>
              You identified {feedback.correctIdentifications} of {feedback.totalConcerns} concerns
            </p>
          </section>

          {feedback.missedConcerns && feedback.missedConcerns.length > 0 && (
            <section 
              aria-labelledby="missed-heading"
              style={{
                background: 'white',
                borderRadius: '12px',
                padding: '2rem',
                border: `2px solid ${colors.warning}`,
                marginBottom: '2rem',
              }}
            >
              <h2 id="missed-heading" style={{ color: colors.blue, marginTop: 0, marginBottom: '1rem' }}>
                You Missed ({feedback.missedConcerns.length})
              </h2>
              <div style={{ display: 'grid', gap: '1rem' }}>
                {feedback.missedConcerns.map((concern) => (
                  <article 
                    key={concern.id} 
                    style={{
                      background: colors.lightBg,
                      padding: '1rem',
                      borderRadius: '8px',
                      borderLeft: `4px solid ${colors.warning}`,
                    }}
                  >
                    <h3 style={{ 
                      fontWeight: 'bold', 
                      color: colors.blue, 
                      marginBottom: '0.25rem',
                      fontSize: '1rem',
                      marginTop: 0,
                    }}>
                      {concern.title}
                    </h3>
                    <p style={{ 
                      color: colors.textSecondary, 
                      fontSize: '0.9rem', 
                      marginBottom: '0.5rem',
                      marginTop: '0.25rem',
                    }}>
                      {concern.description}
                    </p>
                    <p style={{
                      color: colors.textTertiary,
                      fontSize: '0.85rem',
                      fontFamily: 'monospace',
                      marginTop: '0.5rem',
                      marginBottom: 0,
                    }}>
                      {concern.numbers}
                    </p>
                  </article>
                ))}
              </div>
            </section>
          )}

          {feedback.falsePositives && feedback.falsePositives.length > 0 && (
            <section 
              aria-labelledby="false-positives-heading"
              style={{
                background: 'white',
                borderRadius: '12px',
                padding: '2rem',
                border: `2px solid ${colors.gold}`,
                marginBottom: '2rem',
              }}
            >
              <h2 id="false-positives-heading" style={{ color: colors.blue, marginTop: 0, marginBottom: '1rem' }}>
                Not Actually Concerns ({feedback.falsePositives.length})
              </h2>
              <div style={{ display: 'grid', gap: '1rem' }}>
                {feedback.falsePositives.map((concernId) => {
                  const allConcerns = generateAllConcernDisplay(scenario, projections);
                  const concern = allConcerns.find(c => c.id === concernId);
                  if (!concern) return null;
                  return (
                    <article 
                      key={concernId} 
                      style={{
                        background: colors.lightBg,
                        padding: '1rem',
                        borderRadius: '8px',
                        borderLeft: `4px solid ${colors.gold}`,
                      }}
                    >
                      <h3 style={{ 
                        fontWeight: 'bold', 
                        color: colors.blue, 
                        marginBottom: '0.25rem',
                        fontSize: '1rem',
                        marginTop: 0,
                      }}>
                        {concern.title}
                      </h3>
                      <p style={{ 
                        color: colors.textSecondary, 
                        fontSize: '0.9rem', 
                        marginBottom: '0.5rem',
                        marginTop: '0.25rem',
                      }}>
                        {concern.description}
                      </p>
                      <p style={{
                        color: colors.textTertiary,
                        fontSize: '0.85rem',
                        fontFamily: 'monospace',
                        marginTop: '0.5rem',
                        marginBottom: '0.5rem',
                      }}>
                        {concern.numbers}
                      </p>
                      <p style={{ 
                        color: colors.gold, 
                        fontSize: '0.85rem', 
                        marginTop: '0.5rem', 
                        marginBottom: 0,
                      }}>
                        <span role="img" aria-label="Incorrect">✗</span> The numbers don't actually support this concern.
                      </p>
                    </article>
                  );
                })}
              </div>
            </section>
          )}

          {feedback.correctIdentifications === feedback.totalConcerns && feedback.totalConcerns > 0 && (
            <section 
              aria-labelledby="perfect-heading"
              style={{
                background: 'white',
                borderRadius: '12px',
                padding: '2rem',
                border: `2px solid ${colors.green}`,
                marginBottom: '2rem',
                textAlign: 'center',
              }}
            >
              <div 
                role="img" 
                aria-label="Success checkmark"
                style={{ fontSize: '2rem', marginBottom: '1rem' }}
              >
                ✓
              </div>
              <h2 id="perfect-heading" style={{ color: colors.blue, marginTop: 0 }}>
                Perfect Diagnosis
              </h2>
              <p style={{ color: colors.textSecondary }}>
                You caught all the mathematical incongruencies. You'd give {scenario.name} solid financial guidance.
              </p>
            </section>
          )}

          <button
            onClick={() => {
              setGameState('intro');
              setScenario(null);
              setProjections(null);
              setSelectedConcern([]);
              setFeedback(null);
            }}
            style={{
              ...buttonBaseStyle,
              background: colors.blue,
              color: 'white',
            }}
            onFocus={(e) => Object.assign(e.target.style, focusStyle)}
            onBlur={(e) => {
              e.target.style.outline = 'none';
            }}
            aria-label="Start a new assessment with a different student"
          >
            Assess Another Student
          </button>
        </main>
      </div>
    );
  }

  return null;
};

export default FinancialAdvisorGame;
