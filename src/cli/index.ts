#!/usr/bin/env node
import { Command } from 'commander';
import { readFile, writeFile } from 'fs/promises';
import { APP_VERSION } from '../core/types.js';
import { resolveDataDir } from '../core/config.js';
import { TaxDatabase } from '../core/database.js';
import { importCSV, importXLSX, importPDF, importQBO, importOFX } from '../core/importers.js';
import { calculateSummary, identifyContractors, generateCPAPacket, generate1099Summary } from '../core/calculations.js';
import { CategorizationEngine } from '../core/categorization.js';
import { generate1099Checklist, generateContractorReport, generateW9RequestEmail, consolidateContractorPayments, calculatePaymentHistory } from '../core/contractors.js';
import { generateTaxEstimate, generateTaxEstimateReport, calculateQuarterlyEstimate } from '../core/tax-estimation.js';
import { detectFileType, groupByCategory, groupByMonth, formatCurrency } from '../core/utils.js';

const program = new Command();

function out(data: unknown) {
  console.log(JSON.stringify({ success: true, data }, null, 2));
}

function fail(code: string, message: string): never {
  console.log(JSON.stringify({ success: false, error: { code, message } }));
  process.exit(1);
}

program
  .name('taxsnax')
  .description('🧾 TaxSnax - Bite-sized tax info from large data dumps')
  .version(APP_VERSION)
  .option('--json', 'JSON output for scripting')
  .option('-d, --dir <path>', 'Data directory', '.taxsnax');

program
  .command('init')
  .description('Initialize TaxSnax for a new tax year')
  .requiredOption('-y, --year <year>', 'Tax year', '2025')
  .action(async (options) => {
    const dataDir = resolveDataDir(program.opts().dir);
    const db = new TaxDatabase(dataDir);
    await db.init();
    
    const result = {
      initialized: true,
      dataDir,
      taxYear: parseInt(options.year),
    };
    
    if (program.opts().json) return out(result);
    console.log(`\n  🧾 TaxSnax initialized`);
    console.log(`     Data directory: ${dataDir}`);
    console.log(`     Tax year: ${options.year}\n`);
  });

program
  .command('import')
  .description('Import transactions from bank statements')
  .argument('<file>', 'File to import (CSV, XLSX, PDF)')
  .requiredOption('-s, --source <name>', 'Source name (e.g., "Chase Business")')
  .option('-f, --format <format>', 'File format (auto-detected if not specified)')
  .action(async (file, options) => {
    const dataDir = resolveDataDir(program.opts().dir);
    const db = new TaxDatabase(dataDir);
    await db.init();
    
    const format = options.format || file.split('.').pop()?.toLowerCase();
    
    let result;
    try {
      switch (format) {
        case 'csv':
          result = await importCSV(file, options.source);
          break;
        case 'xlsx':
        case 'xls':
          result = await importXLSX(file, options.source);
          break;
        case 'pdf':
          result = await importPDF(file, options.source);
          break;
        case 'qbo':
          result = await importQBO(file, options.source);
          break;
        case 'ofx':
          result = await importOFX(file, options.source);
          break;
        default:
          fail('UNKNOWN_FORMAT', `Unsupported format: ${format}. Use CSV, XLSX, PDF, QBO, or OFX.`);
      }
    } catch (e: any) {
      fail('IMPORT_ERROR', e.message);
    }
    
    // Save transactions
    for (const tx of result.transactions) {
      await db.saveTransaction(tx);
    }
    
    const output = {
      imported: result.imported,
      duplicates: result.duplicates.length,
      total: result.imported + result.duplicates.length,
    };
    
    if (program.opts().json) return out(output);
    console.log(`\n  ✅ Import complete`);
    console.log(`     Imported: ${result.imported}`);
    console.log(`     Duplicates skipped: ${result.duplicates.length}\n`);
  });

program
  .command('summary')
  .description('Generate tax summary')
  .option('-y, --year <year>', 'Tax year', '2025')
  .option('-o, --output <file>', 'Save to file')
  .action(async (options) => {
    const dataDir = resolveDataDir(program.opts().dir);
    const db = new TaxDatabase(dataDir);
    
    const summary = await calculateSummary(db, parseInt(options.year));
    await db.saveSummary(summary);
    
    const packet = generateCPAPacket(summary);
    
    if (options.output) {
      await writeFile(options.output, packet, 'utf8');
    }
    
    if (program.opts().json) return out(summary);
    console.log(packet);
  });

program
  .command('contractors')
  .description('Identify and list 1099 contractors')
  .option('-o, --output <file>', 'Save to file')
  .action(async (options) => {
    const dataDir = resolveDataDir(program.opts().dir);
    const db = new TaxDatabase(dataDir);
    
    const contractors = await identifyContractors(db);
    const needing1099 = contractors.filter(c => c.needs1099);
    
    const summary = generate1099Summary(contractors);
    
    if (options.output) {
      await writeFile(options.output, summary, 'utf8');
    }
    
    if (program.opts().json) return out({ contractors, needing1099 });
    console.log(summary);
  });

program
  .command('business')
  .description('Set business information')
  .requiredOption('-n, --name <name>', 'Business name')
  .requiredOption('-t, --type <type>', 'Business type (sole-proprietorship, llc, s-corp, c-corp, partnership)')
  .option('-e, --ein <ein>', 'EIN')
  .option('-a, --address <address>', 'Business address')
  .action(async (options) => {
    const dataDir = resolveDataDir(program.opts().dir);
    const db = new TaxDatabase(dataDir);
    
    await db.saveBusinessInfo({
      name: options.name,
      businessType: options.type,
      ein: options.ein,
      address: options.address || '',
      taxYear: new Date().getFullYear(),
    });
    
    if (program.opts().json) return out({ saved: true });
    console.log(`\n  ✅ Business info saved\n`);
  });

program
  .command('personal')
  .description('Set personal information')
  .requiredOption('-n, --name <name>', 'Your name')
  .requiredOption('-s, --ssn <ssn>', 'SSN')
  .requiredOption('-a, --address <address>', 'Home address')
  .requiredOption('--status <status>', 'Filing status (single, married-joint, married-separate, head-household)')
  .option('--dependents <n>', 'Number of dependents', '0')
  .action(async (options) => {
    const dataDir = resolveDataDir(program.opts().dir);
    const db = new TaxDatabase(dataDir);
    
    await db.savePersonalInfo({
      name: options.name,
      ssn: options.ssn,
      address: options.address,
      filingStatus: options.status,
      dependents: parseInt(options.dependents),
    });
    
    if (program.opts().json) return out({ saved: true });
    console.log(`\n  ✅ Personal info saved\n`);
  });

program
  .command('cpa-packet')
  .description('Generate complete CPA packet for accountant')
  .option('-y, --year <year>', 'Tax year', '2025')
  .option('-o, --output <file>', 'Output file (default: cpa-packet-2025.txt)')
  .action(async (options) => {
    const dataDir = resolveDataDir(program.opts().dir);
    const db = new TaxDatabase(dataDir);
    
    const summary = await calculateSummary(db, parseInt(options.year));
    const contractors = await identifyContractors(db);
    const business = await db.getBusinessInfo();
    const personal = await db.getPersonalInfo();
    
    const lines: string[] = [];
    lines.push('═══════════════════════════════════════════════════════════════');
    lines.push('                    CPA TAX PACKET');
    lines.push(`                        ${options.year} Tax Year`);
    lines.push('═══════════════════════════════════════════════════════════════');
    lines.push('');
    
    if (personal) {
      lines.push('👤 TAXPAYER INFORMATION');
      lines.push(`   Name: ${personal.name}`);
      lines.push(`   SSN: ${personal.ssn}`);
      lines.push(`   Address: ${personal.address}`);
      lines.push(`   Filing Status: ${personal.filingStatus}`);
      lines.push(`   Dependents: ${personal.dependents}`);
      lines.push('');
    }
    
    if (business) {
      lines.push('🏢 BUSINESS INFORMATION');
      lines.push(`   Business Name: ${business.name}`);
      lines.push(`   Business Type: ${business.businessType}`);
      if (business.ein) lines.push(`   EIN: ${business.ein}`);
      if (business.address) lines.push(`   Address: ${business.address}`);
      lines.push('');
    }
    
    lines.push(generateCPAPacket(summary));
    lines.push('');
    lines.push(generate1099Summary(contractors));
    
    const output = lines.join('\n');
    const outputFile = options.output || `cpa-packet-${options.year}.txt`;
    await writeFile(outputFile, output, 'utf8');
    
    if (program.opts().json) {
      return out({ 
        summary, 
        contractors,
        business,
        personal,
        outputFile,
      });
    }
    
    console.log(output);
    console.log(`\n  ✅ CPA packet saved to: ${outputFile}\n`);
  });

program
  .command('status')
  .description('Show current tax data status')
  .action(async () => {
    const dataDir = resolveDataDir(program.opts().dir);
    const db = new TaxDatabase(dataDir);
    
    const transactions = await db.getAllTransactions();
    const contractors = await db.getAllContractors();
    const business = await db.getBusinessInfo();
    const personal = await db.getPersonalInfo();
    const summary = await db.getSummary();
    
    const result = {
      dataDir,
      transactions: transactions.length,
      contractors: contractors.length,
      contractorsNeeding1099: contractors.filter(c => c.needs1099).length,
      businessInfo: !!business,
      personalInfo: !!personal,
      summary: !!summary,
    };
    
    if (program.opts().json) return out(result);
    
    console.log(`\n  🧾 TaxSnax Status`);
    console.log(`     Data directory: ${dataDir}`);
    console.log(`     Transactions: ${result.transactions}`);
    console.log(`     Contractors: ${result.contractors}`);
    console.log(`     1099s needed: ${result.contractorsNeeding1099}`);
    console.log(`     Business info: ${result.businessInfo ? '✓' : '✗'}`);
    console.log(`     Personal info: ${result.personalInfo ? '✓' : '✗'}`);
    console.log(`     Summary: ${result.summary ? '✓' : '✗'}`);
    console.log('');
  });

// v0.1.1 Commands

program
  .command('1099-checklist')
  .description('Generate 1099-NEC checklist for contractors')
  .option('-o, --output <file>', 'Save to file')
  .action(async (options) => {
    const dataDir = resolveDataDir(program.opts().dir);
    const db = new TaxDatabase(dataDir);
    
    const contractors = await db.getAllContractors();
    const checklist = generate1099Checklist(contractors);
    
    if (options.output) {
      await writeFile(options.output, checklist, 'utf8');
    }
    
    if (program.opts().json) {
      return out({ contractors: contractors.filter(c => c.needs1099) });
    }
    
    console.log(checklist);
    if (options.output) {
      console.log(`\n  ✅ 1099 checklist saved to: ${options.output}\n`);
    }
  });

program
  .command('contractor-report')
  .description('Generate detailed report for a specific contractor')
  .requiredOption('-n, --name <name>', 'Contractor name')
  .option('-o, --output <file>', 'Save to file')
  .action(async (options) => {
    const dataDir = resolveDataDir(program.opts().dir);
    const db = new TaxDatabase(dataDir);
    
    const contractors = await db.getAllContractors();
    const contractor = contractors.find(c => 
      c.name.toLowerCase() === options.name.toLowerCase()
    );
    
    if (!contractor) {
      fail('NOT_FOUND', `Contractor "${options.name}" not found`);
    }
    
    const transactions = await db.getAllTransactions();
    const history = calculatePaymentHistory(contractor, transactions);
    const report = generateContractorReport(contractor, history);
    
    if (options.output) {
      await writeFile(options.output, report, 'utf8');
    }
    
    if (program.opts().json) {
      return out({ contractor, history });
    }
    
    console.log(report);
  });

program
  .command('w9-request')
  .description('Generate W-9 request email for a contractor')
  .requiredOption('-n, --name <name>', 'Contractor name')
  .action(async (options) => {
    const dataDir = resolveDataDir(program.opts().dir);
    const db = new TaxDatabase(dataDir);
    
    const contractors = await db.getAllContractors();
    const contractor = contractors.find(c => 
      c.name.toLowerCase() === options.name.toLowerCase()
    );
    
    if (!contractor) {
      fail('NOT_FOUND', `Contractor "${options.name}" not found`);
    }
    
    const email = generateW9RequestEmail(contractor);
    
    if (program.opts().json) {
      return out({ email, contractor });
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('W-9 REQUEST EMAIL');
    console.log('='.repeat(60) + '\n');
    console.log(email);
    console.log('\n' + '='.repeat(60));
  });

program
  .command('tax-estimate')
  .description('Estimate federal, state, and local taxes')
  .option('-y, --year <year>', 'Tax year', '2025')
  .option('--state <state>', 'State code (e.g., PA, CA, NY)', 'PA')
  .option('--city <city>', 'City for local tax estimate')
  .option('-o, --output <file>', 'Save to file')
  .action(async (options) => {
    const dataDir = resolveDataDir(program.opts().dir);
    const db = new TaxDatabase(dataDir);
    
    const summary = await calculateSummary(db, parseInt(options.year));
    const personal = await db.getPersonalInfo();
    
    if (!personal) {
      fail('MISSING_INFO', 'Personal info required. Run: taxsnax personal --help');
    }
    
    const estimate = generateTaxEstimate(summary, personal, options.state, options.city);
    const report = generateTaxEstimateReport(estimate, summary, personal);
    
    if (options.output) {
      await writeFile(options.output, report, 'utf8');
    }
    
    if (program.opts().json) {
      return out({ estimate, summary });
    }
    
    console.log(report);
    if (options.output) {
      console.log(`\n  ✅ Tax estimate saved to: ${options.output}\n`);
    }
  });

program
  .command('quarterly-estimate')
  .description('Calculate quarterly estimated tax payment')
  .requiredOption('-q, --quarter <n>', 'Quarter (1-4)')
  .requiredOption('-i, --income <amount>', 'YTD income')
  .option('--state <state>', 'State code', 'PA')
  .action(async (options) => {
    const dataDir = resolveDataDir(program.opts().dir);
    const db = new TaxDatabase(dataDir);
    const personal = await db.getPersonalInfo();
    
    if (!personal) {
      fail('MISSING_INFO', 'Personal info required. Run: taxsnax personal --help');
    }
    
    const result = calculateQuarterlyEstimate(
      parseFloat(options.income),
      parseInt(options.quarter),
      personal.filingStatus,
      options.state
    );
    
    if (program.opts().json) {
      return out({ 
        quarter: options.quarter,
        payment: result.payment,
        explanation: result.explanation 
      });
    }
    
    console.log(`\n  💰 Q${options.quarter} Estimated Payment: ${formatCurrency(result.payment)}`);
    console.log(`\n  ${result.explanation}\n`);
  });

program
  .command('reports')
  .description('Generate all tax reports')
  .option('-y, --year <year>', 'Tax year', '2025')
  .option('-o, --output-dir <dir>', 'Output directory', './reports')
  .action(async (options) => {
    const dataDir = resolveDataDir(program.opts().dir);
    const db = new TaxDatabase(dataDir);
    const year = parseInt(options.year);
    
    // Generate all reports
    const summary = await calculateSummary(db, year);
    const contractors = await db.getAllContractors();
    const personal = await db.getPersonalInfo();
    
    const reports: string[] = [];
    
    // 1. Summary Report
    const summaryReport = generateCPAPacket(summary);
    reports.push('summary.txt');
    await writeFile(`${options.outputDir}/summary.txt`, summaryReport, 'utf8').catch(() => {});
    
    // 2. 1099 Checklist
    const checklist1099 = generate1099Checklist(contractors);
    reports.push('1099-checklist.txt');
    await writeFile(`${options.outputDir}/1099-checklist.txt`, checklist1099, 'utf8').catch(() => {});
    
    // 3. Tax Estimate (if personal info available)
    if (personal) {
      const estimate = generateTaxEstimate(summary, personal, 'PA');
      const estimateReport = generateTaxEstimateReport(estimate, summary, personal);
      reports.push('tax-estimate.txt');
      await writeFile(`${options.outputDir}/tax-estimate.txt`, estimateReport, 'utf8').catch(() => {});
    }
    
    // 4. Contractor Reports
    const transactions = await db.getAllTransactions();
    for (const contractor of contractors.filter(c => c.needs1099)) {
      const history = calculatePaymentHistory(contractor, transactions);
      const report = generateContractorReport(contractor, history);
      const safeName = contractor.name.replace(/[^a-z0-9]/gi, '-').toLowerCase();
      reports.push(`contractor-${safeName}.txt`);
      await writeFile(`${options.outputDir}/contractor-${safeName}.txt`, report, 'utf8').catch(() => {});
    }
    
    if (program.opts().json) {
      return out({ reports, outputDir: options.outputDir });
    }
    
    console.log(`\n  📊 Generated ${reports.length} reports in ${options.outputDir}/`);
    console.log('');
    for (const r of reports) {
      console.log(`     • ${r}`);
    }
    console.log('');
  });

program
  .command('categorize')
  .description('Re-categorize transactions using ML engine')
  .option('-y, --year <year>', 'Tax year', '2025')
  .action(async (options) => {
    const dataDir = resolveDataDir(program.opts().dir);
    const db = new TaxDatabase(dataDir);
    
    const transactions = await db.getAllTransactions();
    const engine = new CategorizationEngine();
    
    let updated = 0;
    for (const tx of transactions) {
      if (!tx.category || tx.category === 'Other') {
        const result = engine.categorize(tx.description, tx.amount);
        tx.category = result.category;
        await db.saveTransaction(tx);
        updated++;
      }
    }
    
    if (program.opts().json) {
      return out({ updated, total: transactions.length });
    }
    
    console.log(`\n  ✅ Categorized ${updated} transactions\n`);
  });

program
  .command('recurring')
  .description('Detect recurring expenses')
  .option('-y, --year <year>', 'Tax year', '2025')
  .action(async (options) => {
    const dataDir = resolveDataDir(program.opts().dir);
    const db = new TaxDatabase(dataDir);
    
    const transactions = await db.getAllTransactions();
    const engine = new CategorizationEngine();
    const patterns = engine.detectRecurring(transactions);
    
    if (program.opts().json) {
      return out({ patterns });
    }
    
    console.log('\n  🔄 Recurring Expenses Detected:\n');
    if (patterns.length === 0) {
      console.log('     No recurring patterns found.\n');
    } else {
      for (const p of patterns) {
        console.log(`     ${p.description}`);
        console.log(`       Amount: ${formatCurrency(p.amount)}`);
        console.log(`       Frequency: ${p.frequency}`);
        console.log(`       Last seen: ${p.lastDate}`);
        console.log('');
      }
    }
  });

program.parse();
