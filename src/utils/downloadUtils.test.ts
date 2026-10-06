import { writeFile } from 'xlsx';
import { downloadExcel } from './downloadUtils';

jest.mock('xlsx', () => ({
  ...jest.requireActual('xlsx'),
  writeFile: jest.fn(),
}));

beforeEach(() => jest.mocked(writeFile).mockClear());

test('the patched spreadsheet exporter preserves values and treats formulas as text', () => {
  downloadExcel([
    ['Description', 'Amount'],
    ['=HYPERLINK("https://example.com")', 42.5],
  ], 'Transactions', true);

  const [workbook, filename] = jest.mocked(writeFile).mock.calls[0];
  expect(filename).toBe('Transactions.xlsx');
  const sheet = workbook.Sheets.Sheet1;
  expect(sheet.A2.t).toBe('s');
  expect(sheet.A2.f).toBeUndefined();
  expect(sheet.B2.v).toBe(42.5);
});

test('the spreadsheet exporter handles an empty report', () => {
  expect(() => downloadExcel([], 'Empty')).not.toThrow();
  expect(writeFile).toHaveBeenCalledTimes(1);
});
