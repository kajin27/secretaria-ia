import { supabase } from "./supabase.js";

export async function registerConversation(companyId) {
  const { data, error } = await supabase
    .from("companies")
    .select(`
      id,
      conversations_used,
      plans (
        conversation_limit,
        extra_conversation_price
      )
    `)
    .eq("id", companyId)
    .single();

  if (error) {
    throw new Error("Erro ao buscar empresa");
  }

  const used = data.conversations_used || 0;
  const limit = data.plans.conversation_limit;

  let exceeded = false;
  let extraCost = 0;

  if (used + 1 > limit) {
    exceeded = true;
    extraCost = data.plans.extra_conversation_price;
  }

  await supabase
    .from("companies")
    .update({ conversations_used: used + 1 })
    .eq("id", companyId);

  await supabase.from("conversation_logs").insert({
    company_id: companyId,
    exceeded,
    extra_cost: exceeded ? extraCost : 0
  });

  return { exceeded, extraCost };
}
