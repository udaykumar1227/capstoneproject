import sql from "@/app/api/utils/sql";

// Get a specific patient by ID
export async function GET(request, { params }) {
  try {
    const { id } = params;

    const result = await sql`
      SELECT * FROM patients WHERE id = ${id}
    `;

    if (result.length === 0) {
      return Response.json({ error: "Patient not found" }, { status: 404 });
    }

    return Response.json({ patient: result[0] });
  } catch (error) {
    console.error("Error fetching patient:", error);
    return Response.json({ error: "Failed to fetch patient" }, { status: 500 });
  }
}

// Update a patient
export async function PUT(request, { params }) {
  try {
    const { id } = params;
    const body = await request.json();
    const { name, age, gender, phone, email } = body;

    // Build dynamic update query
    const updates = [];
    const values = [];
    let paramCount = 1;

    if (name !== undefined) {
      updates.push(`name = $${paramCount++}`);
      values.push(name);
    }
    if (age !== undefined) {
      updates.push(`age = $${paramCount++}`);
      values.push(age);
    }
    if (gender !== undefined) {
      updates.push(`gender = $${paramCount++}`);
      values.push(gender);
    }
    if (phone !== undefined) {
      updates.push(`phone = $${paramCount++}`);
      values.push(phone);
    }
    if (email !== undefined) {
      updates.push(`email = $${paramCount++}`);
      values.push(email);
    }

    if (updates.length === 0) {
      return Response.json({ error: "No fields to update" }, { status: 400 });
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);

    const query = `
      UPDATE patients 
      SET ${updates.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `;

    const result = await sql(query, values);

    if (result.length === 0) {
      return Response.json({ error: "Patient not found" }, { status: 404 });
    }

    return Response.json({ patient: result[0] });
  } catch (error) {
    console.error("Error updating patient:", error);
    return Response.json({ error: "Failed to update patient" }, { status: 500 });
  }
}