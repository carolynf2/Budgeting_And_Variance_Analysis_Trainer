class BudgetingTrainer {
    constructor() {
        this.budgetData = {};
        this.actualData = {};
        this.varianceData = {};
        this.charts = {};
        
        this.initializeEventListeners();
        this.initializeCalculations();
    }

    initializeEventListeners() {
        // Tab navigation
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.switchTab(e.target.dataset.tab));
        });

        // Budget form listeners
        this.addInputListeners('budget');
        this.addInputListeners('actual');

        // Button listeners
        document.getElementById('save-budget-btn').addEventListener('click', () => this.saveBudget());
        document.getElementById('load-sample-budget-btn').addEventListener('click', () => this.loadSampleBudget());
        document.getElementById('clear-budget-btn').addEventListener('click', () => this.clearBudget());

        document.getElementById('save-actuals-btn').addEventListener('click', () => this.saveActuals());
        document.getElementById('generate-random-actuals-btn').addEventListener('click', () => this.generateRandomActuals());
        document.getElementById('clear-actuals-btn').addEventListener('click', () => this.clearActuals());

        document.getElementById('calculate-variances-btn').addEventListener('click', () => this.calculateVariances());
        document.getElementById('export-analysis-btn').addEventListener('click', () => this.exportAnalysis());

        // Simulation listeners
        document.querySelectorAll('.scenario-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.applyScenario(e.target.dataset.scenario));
        });
        document.getElementById('apply-custom-scenario-btn').addEventListener('click', () => this.applyCustomScenario());
        document.getElementById('reset-simulation-btn').addEventListener('click', () => this.resetSimulation());
    }

    addInputListeners(type) {
        const fields = [
            'sales', 'service', 'other-revenue',
            'salaries', 'rent', 'marketing', 'supplies', 'travel', 'insurance', 'depreciation', 'other-expenses'
        ];

        fields.forEach(field => {
            const element = document.getElementById(`${type}-${field}`);
            if (element) {
                element.addEventListener('input', () => this.updateTotals(type));
            }
        });
    }

    initializeCalculations() {
        this.updateTotals('budget');
        this.updateTotals('actual');
    }

    switchTab(tabName) {
        // Hide all tabs
        document.querySelectorAll('.tab-content').forEach(tab => {
            tab.classList.remove('active');
        });
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });

        // Show selected tab
        document.getElementById(`${tabName}-tab`).classList.add('active');
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

        // Auto-calculate if switching to analysis tab
        if (tabName === 'analysis' && this.hasBudgetAndActuals()) {
            setTimeout(() => this.calculateVariances(), 100);
        }
    }

    updateTotals(type) {
        const revenueFields = ['sales', 'service', 'other-revenue'];
        const expenseFields = ['salaries', 'rent', 'marketing', 'supplies', 'travel', 'insurance', 'depreciation', 'other-expenses'];

        let totalRevenue = 0;
        let totalExpenses = 0;

        revenueFields.forEach(field => {
            const value = this.getFieldValue(`${type}-${field}`);
            totalRevenue += value;
        });

        expenseFields.forEach(field => {
            const value = this.getFieldValue(`${type}-${field}`);
            totalExpenses += value;
        });

        const netIncome = totalRevenue - totalExpenses;

        // Update displays
        document.getElementById(`total-revenue-${type}`).textContent = this.formatCurrency(totalRevenue);
        document.getElementById(`total-expenses-${type}`).textContent = this.formatCurrency(totalExpenses);
        document.getElementById(`summary-revenue-${type}`).textContent = this.formatCurrency(totalRevenue);
        document.getElementById(`summary-expenses-${type}`).textContent = this.formatCurrency(totalExpenses);
        document.getElementById(`summary-profit-${type}`).textContent = this.formatCurrency(netIncome);

        // Apply color classes
        this.applyAmountColor(document.getElementById(`summary-profit-${type}`), netIncome);

        // Store data
        if (type === 'budget') {
            this.budgetData = {
                revenue: {
                    sales: this.getFieldValue('budget-sales'),
                    service: this.getFieldValue('budget-service'),
                    otherRevenue: this.getFieldValue('budget-other-revenue'),
                    total: totalRevenue
                },
                expenses: {
                    salaries: this.getFieldValue('budget-salaries'),
                    rent: this.getFieldValue('budget-rent'),
                    marketing: this.getFieldValue('budget-marketing'),
                    supplies: this.getFieldValue('budget-supplies'),
                    travel: this.getFieldValue('budget-travel'),
                    insurance: this.getFieldValue('budget-insurance'),
                    depreciation: this.getFieldValue('budget-depreciation'),
                    otherExpenses: this.getFieldValue('budget-other-expenses'),
                    total: totalExpenses
                },
                netIncome: netIncome
            };
        } else {
            this.actualData = {
                revenue: {
                    sales: this.getFieldValue('actual-sales'),
                    service: this.getFieldValue('actual-service'),
                    otherRevenue: this.getFieldValue('actual-other-revenue'),
                    total: totalRevenue
                },
                expenses: {
                    salaries: this.getFieldValue('actual-salaries'),
                    rent: this.getFieldValue('actual-rent'),
                    marketing: this.getFieldValue('actual-marketing'),
                    supplies: this.getFieldValue('actual-supplies'),
                    travel: this.getFieldValue('actual-travel'),
                    insurance: this.getFieldValue('actual-insurance'),
                    depreciation: this.getFieldValue('actual-depreciation'),
                    otherExpenses: this.getFieldValue('actual-other-expenses'),
                    total: totalExpenses
                },
                netIncome: netIncome
            };
        }
    }

    getFieldValue(fieldId) {
        const element = document.getElementById(fieldId);
        return parseFloat(element.value) || 0;
    }

    formatCurrency(amount) {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount);
    }

    formatPercentage(value) {
        return `${value.toFixed(1)}%`;
    }

    applyAmountColor(element, amount) {
        element.classList.remove('positive', 'negative', 'neutral');
        if (amount > 0) {
            element.classList.add('positive');
        } else if (amount < 0) {
            element.classList.add('negative');
        } else {
            element.classList.add('neutral');
        }
    }

    saveBudget() {
        if (this.budgetData.revenue?.total > 0 || this.budgetData.expenses?.total > 0) {
            localStorage.setItem('budgetData', JSON.stringify(this.budgetData));
            this.showMessage('Budget saved successfully!', 'success');
        } else {
            this.showMessage('Please enter budget data before saving.', 'warning');
        }
    }

    loadSampleBudget() {
        const sampleBudget = {
            'budget-sales': 500000,
            'budget-service': 150000,
            'budget-other-revenue': 25000,
            'budget-salaries': 200000,
            'budget-rent': 48000,
            'budget-marketing': 30000,
            'budget-supplies': 12000,
            'budget-travel': 15000,
            'budget-insurance': 18000,
            'budget-depreciation': 25000,
            'budget-other-expenses': 20000
        };

        Object.keys(sampleBudget).forEach(fieldId => {
            document.getElementById(fieldId).value = sampleBudget[fieldId];
        });

        this.updateTotals('budget');
        this.showMessage('Sample budget loaded successfully!', 'success');
    }

    clearBudget() {
        const budgetFields = document.querySelectorAll('[id^="budget-"]');
        budgetFields.forEach(field => field.value = '');
        this.updateTotals('budget');
        this.budgetData = {};
        this.showMessage('Budget cleared.', 'success');
    }

    saveActuals() {
        if (this.actualData.revenue?.total > 0 || this.actualData.expenses?.total > 0) {
            localStorage.setItem('actualData', JSON.stringify(this.actualData));
            this.showMessage('Actual data saved successfully!', 'success');
        } else {
            this.showMessage('Please enter actual data before saving.', 'warning');
        }
    }

    generateRandomActuals() {
        if (!this.budgetData.revenue?.total) {
            this.showMessage('Please create a budget first.', 'warning');
            return;
        }

        const variationRange = 0.2; // ±20% variation

        const generateVariation = (budgetAmount) => {
            const variation = (Math.random() - 0.5) * 2 * variationRange;
            return Math.max(0, budgetAmount * (1 + variation));
        };

        // Generate actual values with realistic variations
        document.getElementById('actual-sales').value = Math.round(generateVariation(this.budgetData.revenue.sales));
        document.getElementById('actual-service').value = Math.round(generateVariation(this.budgetData.revenue.service));
        document.getElementById('actual-other-revenue').value = Math.round(generateVariation(this.budgetData.revenue.otherRevenue));
        
        document.getElementById('actual-salaries').value = Math.round(generateVariation(this.budgetData.expenses.salaries));
        document.getElementById('actual-rent').value = Math.round(generateVariation(this.budgetData.expenses.rent));
        document.getElementById('actual-marketing').value = Math.round(generateVariation(this.budgetData.expenses.marketing));
        document.getElementById('actual-supplies').value = Math.round(generateVariation(this.budgetData.expenses.supplies));
        document.getElementById('actual-travel').value = Math.round(generateVariation(this.budgetData.expenses.travel));
        document.getElementById('actual-insurance').value = Math.round(generateVariation(this.budgetData.expenses.insurance));
        document.getElementById('actual-depreciation').value = Math.round(generateVariation(this.budgetData.expenses.depreciation));
        document.getElementById('actual-other-expenses').value = Math.round(generateVariation(this.budgetData.expenses.otherExpenses));

        this.updateTotals('actual');
        this.showMessage('Random actual data generated!', 'success');
    }

    clearActuals() {
        const actualFields = document.querySelectorAll('[id^="actual-"]');
        actualFields.forEach(field => field.value = '');
        this.updateTotals('actual');
        this.actualData = {};
        this.showMessage('Actual data cleared.', 'success');
    }

    hasBudgetAndActuals() {
        return (this.budgetData.revenue?.total > 0 || this.budgetData.expenses?.total > 0) &&
               (this.actualData.revenue?.total > 0 || this.actualData.expenses?.total > 0);
    }

    calculateVariances() {
        if (!this.hasBudgetAndActuals()) {
            this.showMessage('Please enter both budget and actual data.', 'warning');
            return;
        }

        // Calculate variances
        const revenueVariance = this.actualData.revenue.total - this.budgetData.revenue.total;
        const expenseVariance = this.actualData.expenses.total - this.budgetData.expenses.total;
        const profitVariance = this.actualData.netIncome - this.budgetData.netIncome;

        // Calculate percentages
        const revenueVariancePct = this.budgetData.revenue.total !== 0 ? (revenueVariance / this.budgetData.revenue.total) * 100 : 0;
        const expenseVariancePct = this.budgetData.expenses.total !== 0 ? (expenseVariance / this.budgetData.expenses.total) * 100 : 0;
        const profitVariancePct = this.budgetData.netIncome !== 0 ? (profitVariance / Math.abs(this.budgetData.netIncome)) * 100 : 0;

        // Update summary cards
        this.updateVarianceCard('revenue', revenueVariance, revenueVariancePct, true);
        this.updateVarianceCard('expense', expenseVariance, expenseVariancePct, false);
        this.updateVarianceCard('profit', profitVariance, profitVariancePct, true);

        // Generate detailed variance table
        this.generateVarianceTable();

        // Create charts
        this.createCharts();

        // Generate insights
        this.generateInsights();

        this.showMessage('Variance analysis completed!', 'success');
    }

    updateVarianceCard(type, variance, percentage, revenueType) {
        document.getElementById(`${type}-variance`).textContent = this.formatCurrency(variance);
        document.getElementById(`${type}-variance-pct`).textContent = this.formatPercentage(percentage);
        
        const statusElement = document.getElementById(`${type}-status`);
        const amountElement = document.getElementById(`${type}-variance`);
        const pctElement = document.getElementById(`${type}-variance-pct`);

        // Determine if variance is favorable
        let isFavorable;
        if (revenueType) {
            isFavorable = variance > 0; // Higher revenue/profit is favorable
        } else {
            isFavorable = variance < 0; // Lower expenses are favorable
        }

        // Apply styling
        if (Math.abs(percentage) < 2) {
            statusElement.textContent = 'Neutral';
            statusElement.className = 'variance-status neutral';
            amountElement.classList.add('neutral');
            pctElement.classList.add('neutral');
        } else if (isFavorable) {
            statusElement.textContent = 'Favorable';
            statusElement.className = 'variance-status favorable';
            amountElement.classList.add('positive');
            pctElement.classList.add('positive');
        } else {
            statusElement.textContent = 'Unfavorable';
            statusElement.className = 'variance-status unfavorable';
            amountElement.classList.add('negative');
            pctElement.classList.add('negative');
        }
    }

    generateVarianceTable() {
        const tableBody = document.getElementById('variance-table-body');
        tableBody.innerHTML = '';

        const accounts = [
            { name: 'Sales Revenue', budget: this.budgetData.revenue.sales, actual: this.actualData.revenue.sales, isRevenue: true },
            { name: 'Service Revenue', budget: this.budgetData.revenue.service, actual: this.actualData.revenue.service, isRevenue: true },
            { name: 'Other Revenue', budget: this.budgetData.revenue.otherRevenue, actual: this.actualData.revenue.otherRevenue, isRevenue: true },
            { name: 'Salaries & Wages', budget: this.budgetData.expenses.salaries, actual: this.actualData.expenses.salaries, isRevenue: false },
            { name: 'Rent & Utilities', budget: this.budgetData.expenses.rent, actual: this.actualData.expenses.rent, isRevenue: false },
            { name: 'Marketing', budget: this.budgetData.expenses.marketing, actual: this.actualData.expenses.marketing, isRevenue: false },
            { name: 'Office Supplies', budget: this.budgetData.expenses.supplies, actual: this.actualData.expenses.supplies, isRevenue: false },
            { name: 'Travel', budget: this.budgetData.expenses.travel, actual: this.actualData.expenses.travel, isRevenue: false },
            { name: 'Insurance', budget: this.budgetData.expenses.insurance, actual: this.actualData.expenses.insurance, isRevenue: false },
            { name: 'Depreciation', budget: this.budgetData.expenses.depreciation, actual: this.actualData.expenses.depreciation, isRevenue: false },
            { name: 'Other Expenses', budget: this.budgetData.expenses.otherExpenses, actual: this.actualData.expenses.otherExpenses, isRevenue: false }
        ];

        accounts.forEach(account => {
            if (account.budget !== 0 || account.actual !== 0) {
                const variance = account.actual - account.budget;
                const variancePct = account.budget !== 0 ? (variance / account.budget) * 100 : 0;
                
                let status, statusClass;
                if (Math.abs(variancePct) < 2) {
                    status = 'Neutral';
                    statusClass = 'neutral';
                } else {
                    const isFavorable = account.isRevenue ? variance > 0 : variance < 0;
                    status = isFavorable ? 'Favorable' : 'Unfavorable';
                    statusClass = isFavorable ? 'favorable' : 'unfavorable';
                }

                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${account.name}</td>
                    <td>${this.formatCurrency(account.budget)}</td>
                    <td>${this.formatCurrency(account.actual)}</td>
                    <td class="${statusClass}">${this.formatCurrency(variance)}</td>
                    <td class="${statusClass}">${this.formatPercentage(variancePct)}</td>
                    <td><span class="variance-status ${statusClass}">${status}</span></td>
                `;
                tableBody.appendChild(row);
            }
        });
    }

    createCharts() {
        this.createComparisonChart();
        this.createVarianceChart();
    }

    createComparisonChart() {
        const ctx = document.getElementById('comparison-chart').getContext('2d');
        
        if (this.charts.comparison) {
            this.charts.comparison.destroy();
        }

        this.charts.comparison = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['Revenue', 'Expenses', 'Net Income'],
                datasets: [{
                    label: 'Budget',
                    data: [
                        this.budgetData.revenue.total,
                        this.budgetData.expenses.total,
                        this.budgetData.netIncome
                    ],
                    backgroundColor: 'rgba(102, 126, 234, 0.7)',
                    borderColor: 'rgba(102, 126, 234, 1)',
                    borderWidth: 2
                }, {
                    label: 'Actual',
                    data: [
                        this.actualData.revenue.total,
                        this.actualData.expenses.total,
                        this.actualData.netIncome
                    ],
                    backgroundColor: 'rgba(118, 75, 162, 0.7)',
                    borderColor: 'rgba(118, 75, 162, 1)',
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return '$' + value.toLocaleString();
                            }
                        }
                    }
                },
                plugins: {
                    legend: {
                        position: 'top'
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return context.dataset.label + ': $' + context.raw.toLocaleString();
                            }
                        }
                    }
                }
            }
        });
    }

    createVarianceChart() {
        const ctx = document.getElementById('variance-chart').getContext('2d');
        
        if (this.charts.variance) {
            this.charts.variance.destroy();
        }

        const revenueVariance = this.actualData.revenue.total - this.budgetData.revenue.total;
        const expenseVariance = this.actualData.expenses.total - this.budgetData.expenses.total;
        const profitVariance = this.actualData.netIncome - this.budgetData.netIncome;

        this.charts.variance = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['Revenue Variance', 'Expense Variance', 'Net Income Variance'],
                datasets: [{
                    label: 'Variance ($)',
                    data: [revenueVariance, expenseVariance, profitVariance],
                    backgroundColor: [
                        revenueVariance >= 0 ? 'rgba(76, 175, 80, 0.7)' : 'rgba(244, 67, 54, 0.7)',
                        expenseVariance <= 0 ? 'rgba(76, 175, 80, 0.7)' : 'rgba(244, 67, 54, 0.7)',
                        profitVariance >= 0 ? 'rgba(76, 175, 80, 0.7)' : 'rgba(244, 67, 54, 0.7)'
                    ],
                    borderColor: [
                        revenueVariance >= 0 ? 'rgba(76, 175, 80, 1)' : 'rgba(244, 67, 54, 1)',
                        expenseVariance <= 0 ? 'rgba(76, 175, 80, 1)' : 'rgba(244, 67, 54, 1)',
                        profitVariance >= 0 ? 'rgba(76, 175, 80, 1)' : 'rgba(244, 67, 54, 1)'
                    ],
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        ticks: {
                            callback: function(value) {
                                return '$' + value.toLocaleString();
                            }
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const value = context.raw;
                                const type = context.label;
                                const direction = value >= 0 ? 'Favorable' : 'Unfavorable';
                                if (type.includes('Expense')) {
                                    return `${type}: $${value.toLocaleString()} (${value <= 0 ? 'Favorable' : 'Unfavorable'})`;
                                }
                                return `${type}: $${value.toLocaleString()} (${direction})`;
                            }
                        }
                    }
                }
            }
        });
    }

    generateInsights() {
        const insightsContainer = document.getElementById('insights-content');
        let insights = '';

        const revenueVariance = this.actualData.revenue.total - this.budgetData.revenue.total;
        const expenseVariance = this.actualData.expenses.total - this.budgetData.expenses.total;
        const profitVariance = this.actualData.netIncome - this.budgetData.netIncome;

        const revenueVariancePct = (revenueVariance / this.budgetData.revenue.total) * 100;
        const expenseVariancePct = (expenseVariance / this.budgetData.expenses.total) * 100;

        // Revenue analysis
        if (Math.abs(revenueVariancePct) > 5) {
            if (revenueVariance > 0) {
                insights += `<div class="success-message">
                    <strong>Revenue Performance:</strong> Actual revenue exceeded budget by ${this.formatCurrency(revenueVariance)} (${this.formatPercentage(revenueVariancePct)}). 
                    This indicates strong sales performance or successful market expansion.
                </div>`;
            } else {
                insights += `<div class="warning-message">
                    <strong>Revenue Shortfall:</strong> Actual revenue fell short of budget by ${this.formatCurrency(Math.abs(revenueVariance))} (${this.formatPercentage(Math.abs(revenueVariancePct))}). 
                    Consider reviewing sales strategies, market conditions, or pricing models.
                </div>`;
            }
        }

        // Expense analysis
        if (Math.abs(expenseVariancePct) > 5) {
            if (expenseVariance < 0) {
                insights += `<div class="success-message">
                    <strong>Cost Management:</strong> Actual expenses were ${this.formatCurrency(Math.abs(expenseVariance))} (${this.formatPercentage(Math.abs(expenseVariancePct))}) below budget. 
                    Excellent cost control and operational efficiency.
                </div>`;
            } else {
                insights += `<div class="warning-message">
                    <strong>Cost Overrun:</strong> Actual expenses exceeded budget by ${this.formatCurrency(expenseVariance)} (${this.formatPercentage(expenseVariancePct)}). 
                    Review expense categories for cost reduction opportunities.
                </div>`;
            }
        }

        // Overall profitability
        if (profitVariance > 0) {
            insights += `<div class="success-message">
                <strong>Profitability:</strong> Net income exceeded expectations by ${this.formatCurrency(profitVariance)}. 
                Strong overall financial performance.
            </div>`;
        } else if (profitVariance < 0) {
            insights += `<div class="error-message">
                <strong>Profitability Concern:</strong> Net income fell short by ${this.formatCurrency(Math.abs(profitVariance))}. 
                Focus on revenue enhancement and cost optimization strategies.
            </div>`;
        }

        // Specific account insights
        const significantVariances = this.findSignificantVariances();
        if (significantVariances.length > 0) {
            insights += `<div class="warning-message">
                <strong>Significant Variances Requiring Attention:</strong>
                <ul>
                    ${significantVariances.map(v => `<li>${v}</li>`).join('')}
                </ul>
            </div>`;
        }

        // Recommendations
        insights += `<div class="success-message">
            <strong>Recommendations:</strong>
            <ul>
                <li>Focus on accounts with variances greater than 10%</li>
                <li>Investigate root causes of significant variances</li>
                <li>Update future budgets based on these insights</li>
                <li>Implement regular monitoring for early variance detection</li>
            </ul>
        </div>`;

        insightsContainer.innerHTML = insights;
    }

    findSignificantVariances() {
        const variances = [];
        const threshold = 10; // 10% threshold for significant variances

        const accounts = [
            { name: 'Sales Revenue', budget: this.budgetData.revenue.sales, actual: this.actualData.revenue.sales },
            { name: 'Service Revenue', budget: this.budgetData.revenue.service, actual: this.actualData.revenue.service },
            { name: 'Marketing Expenses', budget: this.budgetData.expenses.marketing, actual: this.actualData.expenses.marketing },
            { name: 'Travel Expenses', budget: this.budgetData.expenses.travel, actual: this.actualData.expenses.travel },
            { name: 'Other Expenses', budget: this.budgetData.expenses.otherExpenses, actual: this.actualData.expenses.otherExpenses }
        ];

        accounts.forEach(account => {
            if (account.budget > 0) {
                const variance = account.actual - account.budget;
                const variancePct = Math.abs((variance / account.budget) * 100);
                
                if (variancePct > threshold) {
                    variances.push(`${account.name}: ${this.formatPercentage(variancePct)} variance (${this.formatCurrency(variance)})`);
                }
            }
        });

        return variances;
    }

    // Scenario simulation methods
    applyScenario(scenarioType) {
        if (!this.budgetData.revenue?.total) {
            this.showMessage('Please create a budget first.', 'warning');
            return;
        }

        let adjustments;

        switch (scenarioType) {
            case 'optimistic':
                adjustments = { revenue: 15, expenses: -5, salaries: 0, marketing: 20 };
                break;
            case 'pessimistic':
                adjustments = { revenue: -20, expenses: 10, salaries: 5, marketing: -30 };
                break;
            case 'realistic':
                adjustments = { revenue: 2, expenses: 3, salaries: 2, marketing: 0 };
                break;
            case 'crisis':
                adjustments = { revenue: -35, expenses: 15, salaries: -10, marketing: -50 };
                break;
            case 'growth':
                adjustments = { revenue: 25, expenses: 8, salaries: 15, marketing: 40 };
                break;
        }

        this.applyAdjustments(adjustments);
        this.displayScenarioResults(scenarioType, adjustments);
    }

    applyCustomScenario() {
        const adjustments = {
            revenue: parseFloat(document.getElementById('revenue-adjustment').value) || 0,
            expenses: parseFloat(document.getElementById('expense-adjustment').value) || 0,
            salaries: parseFloat(document.getElementById('salary-adjustment').value) || 0,
            marketing: parseFloat(document.getElementById('marketing-adjustment').value) || 0
        };

        this.applyAdjustments(adjustments);
        this.displayScenarioResults('custom', adjustments);
    }

    applyAdjustments(adjustments) {
        // Apply revenue adjustment to all revenue fields
        const revenueMultiplier = 1 + (adjustments.revenue / 100);
        document.getElementById('actual-sales').value = Math.round(this.budgetData.revenue.sales * revenueMultiplier);
        document.getElementById('actual-service').value = Math.round(this.budgetData.revenue.service * revenueMultiplier);
        document.getElementById('actual-other-revenue').value = Math.round(this.budgetData.revenue.otherRevenue * revenueMultiplier);

        // Apply general expense adjustment
        const expenseMultiplier = 1 + (adjustments.expenses / 100);
        document.getElementById('actual-rent').value = Math.round(this.budgetData.expenses.rent * expenseMultiplier);
        document.getElementById('actual-supplies').value = Math.round(this.budgetData.expenses.supplies * expenseMultiplier);
        document.getElementById('actual-travel').value = Math.round(this.budgetData.expenses.travel * expenseMultiplier);
        document.getElementById('actual-insurance').value = Math.round(this.budgetData.expenses.insurance * expenseMultiplier);
        document.getElementById('actual-depreciation').value = Math.round(this.budgetData.expenses.depreciation * expenseMultiplier);
        document.getElementById('actual-other-expenses').value = Math.round(this.budgetData.expenses.otherExpenses * expenseMultiplier);

        // Apply specific adjustments
        const salaryMultiplier = 1 + (adjustments.salaries / 100);
        document.getElementById('actual-salaries').value = Math.round(this.budgetData.expenses.salaries * salaryMultiplier);

        const marketingMultiplier = 1 + (adjustments.marketing / 100);
        document.getElementById('actual-marketing').value = Math.round(this.budgetData.expenses.marketing * marketingMultiplier);

        this.updateTotals('actual');
    }

    displayScenarioResults(scenarioType, adjustments) {
        const resultsContainer = document.getElementById('scenario-comparison');
        
        const projectedRevenue = this.actualData.revenue.total;
        const projectedExpenses = this.actualData.expenses.total;
        const projectedProfit = this.actualData.netIncome;

        const revenueChange = projectedRevenue - this.budgetData.revenue.total;
        const expenseChange = projectedExpenses - this.budgetData.expenses.total;
        const profitChange = projectedProfit - this.budgetData.netIncome;

        resultsContainer.innerHTML = `
            <div class="scenario-summary">
                <h4>${scenarioType.charAt(0).toUpperCase() + scenarioType.slice(1)} Scenario Results</h4>
                <div class="scenario-grid">
                    <div class="scenario-item">
                        <strong>Revenue Impact:</strong>
                        <span class="${revenueChange >= 0 ? 'positive' : 'negative'}">
                            ${this.formatCurrency(revenueChange)} (${adjustments.revenue >= 0 ? '+' : ''}${adjustments.revenue}%)
                        </span>
                    </div>
                    <div class="scenario-item">
                        <strong>Expense Impact:</strong>
                        <span class="${expenseChange <= 0 ? 'positive' : 'negative'}">
                            ${this.formatCurrency(expenseChange)} (${adjustments.expenses >= 0 ? '+' : ''}${adjustments.expenses}%)
                        </span>
                    </div>
                    <div class="scenario-item">
                        <strong>Profit Impact:</strong>
                        <span class="${profitChange >= 0 ? 'positive' : 'negative'}">
                            ${this.formatCurrency(profitChange)}
                        </span>
                    </div>
                </div>
                <div class="scenario-summary-line">
                    <strong>Projected Net Income: </strong>
                    <span class="${projectedProfit >= 0 ? 'positive' : 'negative'}">
                        ${this.formatCurrency(projectedProfit)}
                    </span>
                </div>
            </div>
        `;

        this.showMessage(`${scenarioType.charAt(0).toUpperCase() + scenarioType.slice(1)} scenario applied!`, 'success');
    }

    resetSimulation() {
        this.clearActuals();
        document.getElementById('scenario-comparison').innerHTML = '<p>Select a scenario to see the projected results.</p>';
        
        // Reset adjustment inputs
        document.getElementById('revenue-adjustment').value = 0;
        document.getElementById('expense-adjustment').value = 0;
        document.getElementById('salary-adjustment').value = 0;
        document.getElementById('marketing-adjustment').value = 0;
        
        this.showMessage('Simulation reset to original budget.', 'success');
    }

    exportAnalysis() {
        if (!this.hasBudgetAndActuals()) {
            this.showMessage('Please complete variance analysis first.', 'warning');
            return;
        }

        // Create a comprehensive report
        const report = this.generateAnalysisReport();
        
        // Create and download the report
        const blob = new Blob([report], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'variance-analysis-report.txt';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        this.showMessage('Analysis report exported successfully!', 'success');
    }

    generateAnalysisReport() {
        const date = new Date().toLocaleDateString();
        const revenueVariance = this.actualData.revenue.total - this.budgetData.revenue.total;
        const expenseVariance = this.actualData.expenses.total - this.budgetData.expenses.total;
        const profitVariance = this.actualData.netIncome - this.budgetData.netIncome;

        return `
BUDGET VARIANCE ANALYSIS REPORT
Generated: ${date}

SUMMARY
=======
Budget Revenue: ${this.formatCurrency(this.budgetData.revenue.total)}
Actual Revenue: ${this.formatCurrency(this.actualData.revenue.total)}
Revenue Variance: ${this.formatCurrency(revenueVariance)}

Budget Expenses: ${this.formatCurrency(this.budgetData.expenses.total)}
Actual Expenses: ${this.formatCurrency(this.actualData.expenses.total)}
Expense Variance: ${this.formatCurrency(expenseVariance)}

Budget Net Income: ${this.formatCurrency(this.budgetData.netIncome)}
Actual Net Income: ${this.formatCurrency(this.actualData.netIncome)}
Net Income Variance: ${this.formatCurrency(profitVariance)}

DETAILED VARIANCES
==================
Sales Revenue: Budget ${this.formatCurrency(this.budgetData.revenue.sales)}, Actual ${this.formatCurrency(this.actualData.revenue.sales)}, Variance ${this.formatCurrency(this.actualData.revenue.sales - this.budgetData.revenue.sales)}
Service Revenue: Budget ${this.formatCurrency(this.budgetData.revenue.service)}, Actual ${this.formatCurrency(this.actualData.revenue.service)}, Variance ${this.formatCurrency(this.actualData.revenue.service - this.budgetData.revenue.service)}
Other Revenue: Budget ${this.formatCurrency(this.budgetData.revenue.otherRevenue)}, Actual ${this.formatCurrency(this.actualData.revenue.otherRevenue)}, Variance ${this.formatCurrency(this.actualData.revenue.otherRevenue - this.budgetData.revenue.otherRevenue)}

Salaries: Budget ${this.formatCurrency(this.budgetData.expenses.salaries)}, Actual ${this.formatCurrency(this.actualData.expenses.salaries)}, Variance ${this.formatCurrency(this.actualData.expenses.salaries - this.budgetData.expenses.salaries)}
Rent: Budget ${this.formatCurrency(this.budgetData.expenses.rent)}, Actual ${this.formatCurrency(this.actualData.expenses.rent)}, Variance ${this.formatCurrency(this.actualData.expenses.rent - this.budgetData.expenses.rent)}
Marketing: Budget ${this.formatCurrency(this.budgetData.expenses.marketing)}, Actual ${this.formatCurrency(this.actualData.expenses.marketing)}, Variance ${this.formatCurrency(this.actualData.expenses.marketing - this.budgetData.expenses.marketing)}
Supplies: Budget ${this.formatCurrency(this.budgetData.expenses.supplies)}, Actual ${this.formatCurrency(this.actualData.expenses.supplies)}, Variance ${this.formatCurrency(this.actualData.expenses.supplies - this.budgetData.expenses.supplies)}
Travel: Budget ${this.formatCurrency(this.budgetData.expenses.travel)}, Actual ${this.formatCurrency(this.actualData.expenses.travel)}, Variance ${this.formatCurrency(this.actualData.expenses.travel - this.budgetData.expenses.travel)}
Insurance: Budget ${this.formatCurrency(this.budgetData.expenses.insurance)}, Actual ${this.formatCurrency(this.actualData.expenses.insurance)}, Variance ${this.formatCurrency(this.actualData.expenses.insurance - this.budgetData.expenses.insurance)}
Depreciation: Budget ${this.formatCurrency(this.budgetData.expenses.depreciation)}, Actual ${this.formatCurrency(this.actualData.expenses.depreciation)}, Variance ${this.formatCurrency(this.actualData.expenses.depreciation - this.budgetData.expenses.depreciation)}
Other Expenses: Budget ${this.formatCurrency(this.budgetData.expenses.otherExpenses)}, Actual ${this.formatCurrency(this.actualData.expenses.otherExpenses)}, Variance ${this.formatCurrency(this.actualData.expenses.otherExpenses - this.budgetData.expenses.otherExpenses)}

RECOMMENDATIONS
===============
1. Focus on accounts with variances greater than 10%
2. Investigate root causes of significant variances
3. Update future budgets based on these insights
4. Implement regular monitoring for early variance detection
5. Consider adjusting operational strategies based on variance patterns
        `;
    }

    showMessage(message, type) {
        // Create and show a temporary message
        const messageDiv = document.createElement('div');
        messageDiv.className = `${type}-message`;
        messageDiv.textContent = message;
        messageDiv.style.position = 'fixed';
        messageDiv.style.top = '20px';
        messageDiv.style.right = '20px';
        messageDiv.style.zIndex = '1000';
        messageDiv.style.borderRadius = '5px';
        messageDiv.style.padding = '15px';
        messageDiv.style.maxWidth = '300px';

        document.body.appendChild(messageDiv);

        setTimeout(() => {
            if (messageDiv.parentNode) {
                messageDiv.parentNode.removeChild(messageDiv);
            }
        }, 3000);
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new BudgetingTrainer();
});