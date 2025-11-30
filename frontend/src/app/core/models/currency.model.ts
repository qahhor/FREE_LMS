export interface CurrencyRate {
  id: number;
  code: string;
  ccy: string;
  ccyNameRu: string;
  ccyNameUz: string;
  ccyNameEn: string;
  nominal: number;
  rate: number;
  diff: number;
  date: string;
}

export interface ConvertRequest {
  code: string;
  amount: number;
}
