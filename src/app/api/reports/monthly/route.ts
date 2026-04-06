import { supabaseAdmin } from "@/lib/supabase-server";
import { getAuthUserId } from "@/lib/session";
import { sendEmail } from "@/lib/email";
import { NextRequest, NextResponse } from "next/server";

const MONTH_NAMES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

function formatCurrency(amount: number): string {
  return "$" + amount.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export async function POST(request: NextRequest) {
  const authUserId = getAuthUserId(request);
  if (!authUserId) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { month } = await request.json(); // format "YYYY-MM"

  if (!month || !/^\d{4}-\d{2}$/.test(month)) {
    return NextResponse.json(
      { error: "Formato de mes invalido. Usa YYYY-MM" },
      { status: 400 }
    );
  }

  // Get user with email
  const { data: user } = await supabaseAdmin
    .from("users")
    .select("id, display_name, email")
    .eq("id", authUserId)
    .single();

  if (!user || !user.email) {
    return NextResponse.json(
      { error: "Necesitas tener un email registrado para recibir reportes" },
      { status: 400 }
    );
  }

  const [yearStr, monthStr] = month.split("-");
  const year = parseInt(yearStr);
  const monthIdx = parseInt(monthStr) - 1;
  const monthName = MONTH_NAMES[monthIdx];

  // Get last day of month
  const lastDay = new Date(year, monthIdx + 1, 0).getDate();
  const from = `${month}-01`;
  const to = `${month}-${String(lastDay).padStart(2, "0")}`;

  // Fetch expenses
  const { data: expenses } = await supabaseAdmin
    .from("personal_expenses")
    .select("*")
    .eq("user_id", authUserId)
    .gte("date", from)
    .lte("date", to)
    .order("date", { ascending: true });

  if (!expenses || expenses.length === 0) {
    return NextResponse.json(
      { error: `No hay gastos registrados en ${monthName} ${year}` },
      { status: 404 }
    );
  }

  // Calculate totals
  const totalSpent = expenses.reduce((sum, e) => sum + e.amount, 0);

  // By category
  const catMap: Record<string, number> = {};
  expenses.forEach((e) => {
    catMap[e.category] = (catMap[e.category] || 0) + e.amount;
  });
  const categories = Object.entries(catMap)
    .map(([name, amount]) => ({ name, amount, pct: ((amount / totalSpent) * 100).toFixed(1) }))
    .sort((a, b) => b.amount - a.amount);

  // By payment method
  const methodMap: Record<string, number> = {};
  expenses.forEach((e) => {
    methodMap[e.payment_method] = (methodMap[e.payment_method] || 0) + e.amount;
  });
  const methods = Object.entries(methodMap)
    .map(([name, amount]) => ({ name, amount }))
    .sort((a, b) => b.amount - a.amount);

  // Fetch budgets for this month
  const { data: budgets } = await supabaseAdmin
    .from("category_budgets")
    .select("*")
    .eq("user_id", authUserId)
    .eq("month", month);

  // Build budget status
  let budgetRows = "";
  if (budgets && budgets.length > 0) {
    const budgetHtml = budgets.map((b) => {
      const spent = catMap[b.category] || 0;
      const pct = b.budget_amount > 0 ? ((spent / b.budget_amount) * 100).toFixed(0) : "0";
      const color = spent > b.budget_amount ? "#EF4444" : spent > b.budget_amount * 0.8 ? "#F59E0B" : "#059669";
      return `<tr>
        <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;">${b.category}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;text-align:right;">${formatCurrency(b.budget_amount)}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;text-align:right;">${formatCurrency(spent)}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;text-align:right;color:${color};font-weight:bold;">${pct}%</td>
      </tr>`;
    }).join("");

    budgetRows = `
      <h3 style="color:#0F172A;margin:24px 0 12px;">Presupuesto</h3>
      <table style="width:100%;border-collapse:collapse;font-size:14px;">
        <thead>
          <tr style="background:#F8FAFC;">
            <th style="padding:8px 12px;text-align:left;border-bottom:2px solid #e5e7eb;">Categoria</th>
            <th style="padding:8px 12px;text-align:right;border-bottom:2px solid #e5e7eb;">Presupuesto</th>
            <th style="padding:8px 12px;text-align:right;border-bottom:2px solid #e5e7eb;">Gastado</th>
            <th style="padding:8px 12px;text-align:right;border-bottom:2px solid #e5e7eb;">Uso</th>
          </tr>
        </thead>
        <tbody>${budgetHtml}</tbody>
      </table>`;
  }

  const categoryRows = categories.map((c) => `
    <tr>
      <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;">${c.name}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;text-align:right;">${formatCurrency(c.amount)}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;text-align:right;color:#6B7280;">${c.pct}%</td>
    </tr>
  `).join("");

  const methodRows = methods.map((m) => `
    <tr>
      <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;">${m.name}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #e5e7eb;text-align:right;">${formatCurrency(m.amount)}</td>
    </tr>
  `).join("");

  const html = `
    <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:600px;margin:0 auto;">
      <div style="background:#0F172A;padding:24px;text-align:center;border-radius:12px 12px 0 0;">
        <h1 style="color:white;margin:0;font-size:24px;">MiFinanzas</h1>
        <p style="color:#059669;margin:4px 0 0;font-size:14px;">Reporte Mensual</p>
      </div>
      <div style="background:white;padding:24px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 12px 12px;">
        <h2 style="color:#0F172A;margin:0 0 16px;text-align:center;">${monthName} ${year}</h2>

        <div style="background:#F8FAFC;border-left:4px solid #059669;padding:16px;border-radius:8px;text-align:center;margin-bottom:24px;">
          <p style="color:#6B7280;font-size:12px;margin:0;text-transform:uppercase;">Total Gastado</p>
          <p style="color:#0F172A;font-size:28px;font-weight:bold;margin:4px 0 0;">${formatCurrency(totalSpent)}</p>
          <p style="color:#6B7280;font-size:13px;margin:4px 0 0;">${expenses.length} gasto${expenses.length !== 1 ? "s" : ""}</p>
        </div>

        <h3 style="color:#0F172A;margin:0 0 12px;">Por Categoria</h3>
        <table style="width:100%;border-collapse:collapse;font-size:14px;">
          <thead>
            <tr style="background:#F8FAFC;">
              <th style="padding:8px 12px;text-align:left;border-bottom:2px solid #e5e7eb;">Categoria</th>
              <th style="padding:8px 12px;text-align:right;border-bottom:2px solid #e5e7eb;">Monto</th>
              <th style="padding:8px 12px;text-align:right;border-bottom:2px solid #e5e7eb;">%</th>
            </tr>
          </thead>
          <tbody>${categoryRows}</tbody>
        </table>

        <h3 style="color:#0F172A;margin:24px 0 12px;">Por Metodo de Pago</h3>
        <table style="width:100%;border-collapse:collapse;font-size:14px;">
          <thead>
            <tr style="background:#F8FAFC;">
              <th style="padding:8px 12px;text-align:left;border-bottom:2px solid #e5e7eb;">Metodo</th>
              <th style="padding:8px 12px;text-align:right;border-bottom:2px solid #e5e7eb;">Monto</th>
            </tr>
          </thead>
          <tbody>${methodRows}</tbody>
        </table>

        ${budgetRows}

        <p style="color:#6B7280;font-size:12px;text-align:center;margin:24px 0 0;">
          Este reporte fue generado automaticamente por MiFinanzas.
        </p>
      </div>
    </div>
  `;

  const sent = await sendEmail({
    to: user.email,
    subject: `Reporte ${monthName} ${year} - MiFinanzas`,
    html,
  });

  if (!sent) {
    return NextResponse.json(
      { error: "Error al enviar el email" },
      { status: 500 }
    );
  }

  return NextResponse.json({ message: `Reporte de ${monthName} ${year} enviado a ${user.email}` });
}
