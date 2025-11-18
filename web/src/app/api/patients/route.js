import sql from "@/app/api/utils/sql";

// Create a new patient
export async function POST(request) {
  try {
    const body = await request.json();
    const { name, age, gender, phone, email } = body;

    if (!name) {
      return Response.json({ error: "Patient name is required" }, { status: 400 });
    }

    const result = await sql`
      INSERT INTO patients (name, age, gender, phone, email)
      VALUES (${name}, ${age || null}, ${gender || null}, ${phone || null}, ${email || null})
      RETURNING *
    `;

    return Response.json({ patient: result[0] });
  } catch (error) {
    console.error("Error creating patient:", error);
    return Response.json({ error: "Failed to create patient" }, { status: 500 });
  }
}

// Get all patients or search by name
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');

    let patients;
    if (search) {
      patients = await sql`
        SELECT * FROM patients 
        WHERE LOWER(name) LIKE LOWER(${'%' + search + '%'})
        ORDER BY name ASC
      `;
    } else {
      patients = await sql`
        SELECT * FROM patients 
        ORDER BY name ASC
      `;
    }

    return Response.json({ patients });
  } catch (error) {
    console.error("Error fetching patients:", error);
    return Response.json({ error: "Failed to fetch patients" }, { status: 500 });
  }
}