import { NextRequest, NextResponse } from 'next/server';

const EPAYCO_STATUS_MAP: Record<number, string> = {
  1: 'COMPLETED',
  2: 'FAILED',
  3: 'PENDING',
  4: 'FAILED',
};

async function processConfirmation(data: Record<string, unknown>) {
  const {
    x_cust_id_cliente,
    x_ref_payco,
    x_id_invoice,
    x_amount,
    x_currency_code,
    x_transaction_id,
    x_approval_code,
    x_cod_response,
    x_franchise,
    x_customer_email,
    x_transaction_date,
  } = data;

  // Validate origin (only if env var is set)
  const expectedCustomerId = process.env.NEXT_PUBLIC_EPAYCO_CUSTOMER_ID;
  if (expectedCustomerId && x_cust_id_cliente !== expectedCustomerId) {
    console.error('ePayco confirmation: invalid x_cust_id_cliente', x_cust_id_cliente);
    return NextResponse.json({ error: 'ID de cliente no válido' }, { status: 400 });
  }

  const codResponse =
    typeof x_cod_response === 'string' ? parseInt(x_cod_response, 10) : (x_cod_response as number);

  const paymentStatus = EPAYCO_STATUS_MAP[codResponse] ?? 'UNKNOWN';

  const backendUrl = process.env.AUTH_API_BASE_URL || process.env.NEXT_PUBLIC_API_URL;

  // Forward to backend REST endpoint to update order + subscription
  try {
    const resp = await fetch(`${backendUrl}/payments/epayco/confirm`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ref_payco: x_ref_payco,
        transaction_id: x_transaction_id,
        reference: x_id_invoice,
        amount: x_amount,
        currency: x_currency_code ?? 'COP',
        franchise: x_franchise,
        email: x_customer_email,
        approval_code: x_approval_code,
        transaction_date: x_transaction_date,
        response_code: codResponse,
        status: paymentStatus,
      }),
    });

    if (!resp.ok) {
      const errText = await resp.text();
      console.error('ePayco confirmation: backend error', resp.status, errText);
      // Still return 200 to ePayco so it doesn't retry infinitely
    }
  } catch (err) {
    console.error('ePayco confirmation: failed to reach backend', err);
  }

  return NextResponse.json({
    message: 'Confirmación procesada',
    status: paymentStatus,
    ref_payco: x_ref_payco,
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    return processConfirmation(body);
  } catch (error) {
    console.error('Error procesando confirmación POST de ePayco:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const data: Record<string, unknown> = {};
    searchParams.forEach((value, key) => {
      data[key] = key === 'x_cod_response' ? parseInt(value, 10) : value;
    });
    return processConfirmation(data);
  } catch (error) {
    console.error('Error procesando confirmación GET de ePayco:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
