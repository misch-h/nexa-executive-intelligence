export type ExecutiveMetric = {
  metric_id: string;
  metric_name: string;
  metric_value: number;
  business_definition: string;
  calculation_logic: string;
  data_product: string;
  certification_status: string;
  numerator_value: number | null;
  denominator_value: number | null;
  as_of_date: string;
  status: string;
  owner_role: string;
};