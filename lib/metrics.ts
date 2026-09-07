export type RAGStatus = "GREEN" | "AMBER" | "RED" | "GREY";

export type ExecutiveMetric = {
  metric_id: string;
  metric_name: string;
  metric_value: number;

  unit: string;
  domain: string;

  target_value: number | null;
  variance_to_target: number | null;
  variance_status: "FAVOURABLE" | "ADVERSE" | "NEUTRAL";

  green_threshold: number | null;
  amber_threshold: number | null;
  red_threshold: number | null;

  rag_direction: "HIGHER_IS_BETTER" | "LOWER_IS_BETTER";
  rag_status: RAGStatus;

  previous_value: number | null;
  absolute_change: number | null;
  trend_pct: number | null;
  trend_direction: "UP" | "DOWN" | "FLAT";

  business_definition: string;
  calculation_logic: string;

  data_product: string;
  certification_status: string;

  numerator_value: number | null;
  denominator_value: number | null;

  as_of_date: string;
  calculated_at: string;
  status: string;

  owner_role: string;
};

export type MetricHistoryPoint = {
  metric_id: string;
  metric_name: string;
  domain: string;
  unit: string;
  metric_value: number;
  as_of_date: string;
};