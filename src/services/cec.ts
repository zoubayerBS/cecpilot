'use server';

import { getDb } from '@/lib/postgres';
import { cecForms, sessions, users } from '@/lib/db/schema';
import type { CecFormValues } from '@/components/cec-form/schema';
import { eq, desc, sql } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';
import { parse, differenceInMinutes, isValid } from 'date-fns';

export type CecReport = Omit<CecFormValues, 'createdAt' | 'updatedAt'> & {
  id: string;
  createdAt?: string;
  updatedAt?: string;
};

// Function to save or update the CEC form data in PostgreSQL
export async function saveCecForm(
  formData: CecFormValues,
): Promise<string> {
  try {
    const { id, ...data } = formData;

    const structuredData = {
      patientInfo: {
        numero_cec: data.numero_cec || '',
        date_cec: data.date_cec || '',
        nom_prenom: data.nom_prenom || '',
        matricule: data.matricule || '',
        ch: data.ch || '',
        date_naissance: data.date_naissance || '',
        age: data.age || null,
        sexe: data.sexe,
        poids: data.poids || null,
        taille: data.taille || null,
        surface_corporelle: data.surface_corporelle || null,
        debit_theorique: data.debit_theorique || null,
        origine: data.origine || '',
        diagnostic: data.diagnostic || '',
        intervention: data.intervention || '',
      },
      teamInfo: {
        operateur: data.operateur || '',
        aide_op: data.aide_op || '',
        instrumentiste: data.instrumentiste || '',
        perfusionniste: data.perfusionniste || '',
        panseur: data.panseur || '',
        anesthesiste: data.anesthesiste || '',
        technicien_anesthesie: data.technicien_anesthesie || '',
      },
      preOpBilan: {
        gs: data.gs || '',
        hte: data.hte || '',
        hb: data.hb || '',
        na: data.na || '',
        k: data.k || '',
        creat: data.creat || '',
        protides: data.protides || '',
      },
      materiel: {
        oxygenateur: data.oxygenateur || '',
        circuit: data.circuit || '',
        canule_art: data.canule_art || '',
        canule_vein: data.canule_vein || '',
        canule_cardio: data.canule_cardio || '',
        canule_decharge: data.canule_decharge || '',
        kit_hemo: data.kit_hemo || '',
        heparine_circuit: data.heparine_circuit || null,
        heparine_malade: data.heparine_malade || null,
        heparine_total: data.heparine_total || null,
        remplacement_valvulaire: data.remplacement_valvulaire,
        valve_aortique: data.valve_aortique || false,
        valve_mitrale: data.valve_mitrale || false,
        valve_tricuspide: data.valve_tricuspide || false,
        priming: data.priming || [],
      },
      deroulement: {
        duree_assistance: data.duree_assistance || '',
        duree_cec: data.duree_cec || '',
        duree_clampage: data.duree_clampage || '',
      },
      bloodGas: data.bloodGases || [],
      timeline: data.timelineEvents || [],
      cardioplegia: {
        type_cardioplegie: data.type_cardioplegie,
        autre_cardioplegie: data.autre_cardioplegie || '',
        cardioplegiaDoses: data.cardioplegiaDoses || [],
      },
      hemodynamicMonitoring: data.hemodynamicMonitoring || [],
      bloodProducts: data.autres_drogues || [],
      balanceIO: {
        entrees_apports_anesthesiques: data.entrees_apports_anesthesiques || null,
        entrees_priming: data.entrees_priming || null,
        entrees_cardioplegie: data.entrees_cardioplegie || null,
        sorties_diurese: data.sorties_diurese || null,
        sorties_hemofiltration: data.sorties_hemofiltration || null,
        sorties_aspiration_perdue: data.sorties_aspiration_perdue || null,
        sorties_sang_pompe_residuel: data.sorties_sang_pompe_residuel || null,
        total_entrees: data.total_entrees || null,
        total_sorties: data.total_sorties || null,
      },
      examensComplementaires: {
        echo_coeur: data.echo_coeur || '',
        coro: data.coro || '',
      },
      observations: data.observations || '',
    };

    if (id) {
      // Update existing document
      const db = getDb();
      const updatedForms = await db.update(cecForms)
        .set({ ...structuredData })
        .where(eq(cecForms.id, Number(id)))
        .returning({ updatedId: cecForms.id });
      return updatedForms[0].updatedId.toString();
    } else {
      // Create new document
      const db = getDb();
      const newForms = await db.insert(cecForms)
        .values(structuredData)
        .returning({ insertedId: cecForms.id });
      return newForms[0].insertedId.toString();
    }
  } catch (error) {
    console.error("Error saving document: ", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to save form data to PostgreSQL: ${errorMessage}`);
  }
}

// Function to get all CEC forms from PostgreSQL
export async function getCecForms(): Promise<CecReport[]> {
  try {
    const db = getDb();
    const forms = await db.select().from(cecForms).orderBy(desc(cecForms.createdAt));
    return forms.map(form => {
      const {
        patientInfo,
        teamInfo,
        preOpBilan,
        materiel,
        deroulement,
        bloodGas,
        timeline,
        cardioplegia,
        hemodynamicMonitoring,
        bloodProducts,
        balanceIO,
        examensComplementaires,
        observations,
        ...rest
      } = form;

      return {
        ...rest,
        ...(patientInfo as any),
        ...(teamInfo as any),
        ...(preOpBilan as any),
        ...(materiel as any),
        ...(deroulement as any),
        bloodGases: bloodGas as any,
        timelineEvents: timeline as any,
        type_cardioplegie: (cardioplegia as any)?.type_cardioplegie,
        autre_cardioplegie: (cardioplegia as any)?.autre_cardioplegie,
        cardioplegiaDoses: (cardioplegia as any)?.cardioplegiaDoses,
        hemodynamicMonitoring: hemodynamicMonitoring as any,
        autres_drogues: bloodProducts as any,
        ...(balanceIO as any),
        ...(examensComplementaires as any),
        observations,
        id: form.id.toString(),
        createdAt: form.createdAt?.toISOString(),
        updatedAt: form.updatedAt?.toISOString(),
      } as CecReport;
    });
  } catch (error) {
    console.error("Error getting documents: ", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to get form data from PostgreSQL: ${errorMessage}`);
  }
}

// Function to get a single CEC form by its ID
export async function getCecFormById(id: string): Promise<CecReport | null> {
  try {
    const db = getDb();
    const formResult = await db.select().from(cecForms).where(eq(cecForms.id, Number(id)));

    if (formResult.length > 0) {
      const form = formResult[0];
      const {
        patientInfo,
        teamInfo,
        preOpBilan,
        materiel,
        deroulement,
        bloodGas,
        timeline,
        cardioplegia,
        hemodynamicMonitoring,
        bloodProducts,
        balanceIO,
        examensComplementaires,
        observations,
        ...rest
      } = form;

      return {
        ...rest,
        ...(patientInfo as any),
        ...(teamInfo as any),
        ...(preOpBilan as any),
        ...(materiel as any),
        ...(deroulement as any),
        bloodGases: bloodGas as any,
        timelineEvents: timeline as any,
        type_cardioplegie: (cardioplegia as any)?.type_cardioplegie,
        autre_cardioplegie: (cardioplegia as any)?.autre_cardioplegie,
        cardioplegiaDoses: (cardioplegia as any)?.cardioplegiaDoses,
        hemodynamicMonitoring: hemodynamicMonitoring as any,
        autres_drogues: bloodProducts as any,
        ...(balanceIO as any),
        ...(examensComplementaires as any),
        observations,
        id: form.id.toString(),
        createdAt: form.createdAt?.toISOString(),
        updatedAt: form.updatedAt?.toISOString(),
      } as CecReport;
    } else {
      console.log("No such document!");
      return null;
    }
  } catch (error) {
    console.error("Error getting document by ID: ", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to get form data by ID from PostgreSQL: ${errorMessage}`);
  }
}

// Function to delete a CEC form by its ID
export async function deleteCecForm(id: string): Promise<void> {
  try {
    const db = getDb();
    await db.delete(cecForms).where(eq(cecForms.id, Number(id)));
  } catch (error) {
    console.error("Error deleting document: ", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to delete form data from PostgreSQL: ${errorMessage}`);
  }
}

// #region Session Management
export async function createSession(username: string): Promise<string> {
  const token = Math.random().toString(36).substring(2);
  const expires = new Date(Date.now() + 8 * 60 * 60 * 1000); // 8 hours from now

  const db = getDb();
  await db.insert(sessions).values({
    token,
    username,
    expires,
  });
  return token;
}

export async function validateSession(token: string): Promise<{ username: string } | null> {
  const db = getDb();
  const sessionResult = await db.select().from(sessions).where(eq(sessions.token, token));

  if (sessionResult.length === 0) {
    return null;
  }

  const session = sessionResult[0];
  const expires = session.expires;

  if (expires && expires < new Date()) {
    const db = getDb();
    await db.delete(sessions).where(eq(sessions.token, token)); // Clean up expired session
    return null;
  }

  return { username: session.username! };
}

export async function deleteSession(token: string): Promise<void> {
  const db = getDb();
  await db.delete(sessions).where(eq(sessions.token, token)).catch(error => {
    console.warn("Could not delete session, it might have already been removed:", error);
  });
}
// #endregion

// #region AI Features
export async function getAiFlowResponse(flowName: string, input: any): Promise<any> {
  try {
    const response = await fetch(`http://127.0.0.1:4000/flows/${flowName}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ input }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`AI flow '${flowName}' failed with status ${response.status}: ${errorText}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`Error calling AI flow '${flowName}':`, error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to get AI flow response: ${errorMessage}`);
  }
}
// #endregion
// Function to get a user by username
export async function getUserByUsername(username: string) {
  try {
    const db = getDb();
    const userResult = await db.select().from(users).where(eq(users.username, username));
    return userResult.length > 0 ? userResult[0] : null;
  } catch (error) {
    console.error('Error getting user by username:', error);
    throw new Error('Failed to fetch user from PostgreSQL.');
  }
}


// #region 2FA
import { authenticator } from 'otplib';

export async function verifyUserPassword(username: string, password: string): Promise<{ id: number; username: string; isTwoFactorEnabled: boolean } | null> {
  try {
    const db = getDb();
    const result = await db.select({
      id: users.id,
      username: users.username,
      isTwoFactorEnabled: users.isTwoFactorEnabled,
    })
      .from(users)
      .where(sql`${users.username} = ${username} AND ${users.password} = crypt(${password}, ${users.password})`);

    if (result.length > 0) {
      return {
        ...result[0],
        isTwoFactorEnabled: result[0].isTwoFactorEnabled || false
      };
    }
    return null;
  } catch (error) {
    console.error('Error verifying user password:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to verify user password: ${errorMessage}`);
  }
}
// ... existing imports ...

export async function getUserStatus(username: string): Promise<{ isTwoFactorEnabled: boolean } | null> {
  try {
    const db = getDb();
    const userResult = await db.select({ isTwoFactorEnabled: users.isTwoFactorEnabled }).from(users).where(eq(users.username, username));
    if (userResult.length > 0) {
      return { isTwoFactorEnabled: userResult[0].isTwoFactorEnabled || false };
    }
    return null;
  } catch (error) {
    console.error("Error fetching user status:", error);
    return null;
  }
}

export async function generateTwoFactorSecret(username: string) {
  try {
    const secret = authenticator.generateSecret();
    // otpauth://totp/CECPilot:username?secret=SEC&issuer=CECPilot
    const otpauth = authenticator.keyuri(username, 'CECPilot', secret);
    return { secret, otpauth };
  } catch (error) {
    throw new Error('Failed to generate 2FA secret');
  }
}

export async function enableTwoFactor(username: string, secret: string, token: string) {
  const isValid = authenticator.check(token, secret);
  if (!isValid) {
    throw new Error('Invalid token');
  }

  const db = getDb();
  await db.update(users)
    .set({ twoFactorSecret: secret, isTwoFactorEnabled: true })
    .where(eq(users.username, username));
  return true;
}

export async function verifyTwoFactor(username: string, token: string) {
  const db = getDb();
  const userResult = await db.select({ secret: users.twoFactorSecret }).from(users).where(eq(users.username, username));
  if (userResult.length === 0 || !userResult[0].secret) return false;
  return authenticator.check(token, userResult[0].secret);
}

export async function updateUser(userId: number, data: { username?: string; password?: string }) {
  try {
    const db = getDb();
    const updateData: any = {};
    if (data.username) updateData.username = data.username;
    if (data.password) {
      // Use PostgreSQL crypt for hashing: crypt('password', gen_salt('bf'))
      updateData.password = sql`crypt(${data.password}, gen_salt('bf'))`;
    }

    if (Object.keys(updateData).length === 0) return true;

    await db.update(users)
      .set(updateData)
      .where(eq(users.id, userId));
    return true;
  } catch (error) {
    console.error('Error updating user:', error);
    throw new Error('Failed to update user profile');
  }
}

export async function disableTwoFactor(username: string) {
  const db = getDb();
  await db.update(users)
    .set({ twoFactorSecret: null, isTwoFactorEnabled: false })
    .where(eq(users.username, username));
}
// #endregion

export async function repairMissingDurations(): Promise<{ updated: number, errors: number }> {
  try {
    const db = getDb();
    const reports = await db.select().from(cecForms);
    let updatedCount = 0;
    let errorCount = 0;

    for (const report of reports) {
      const timeline = report.timeline as any[] || [];
      const deroulement = report.deroulement as any || {};

      let needsUpdate = false;
      const newDeroulement = { ...deroulement };

      const findTime = (type: string) => {
        const event = timeline.find(e => e.type === type);
        if (!event?.time) return null;
        try {
          return parse(event.time, 'HH:mm', new Date());
        } catch (e) {
          return null;
        }
      };

      // Fix CEC Duration
      if (!deroulement.duree_cec) {
        const start = findTime('Départ CEC');
        const end = findTime('Fin CEC');
        if (start && end && isValid(start) && isValid(end)) {
          const diff = differenceInMinutes(end, start);
          newDeroulement.duree_cec = Math.max(0, diff).toString();
          needsUpdate = true;
        }
      }

      // Fix Clamping Duration
      if (!deroulement.duree_clampage) {
        const start = findTime('Clampage');
        const end = findTime('Déclampage');
        if (start && end && isValid(start) && isValid(end)) {
          const diff = differenceInMinutes(end, start);
          newDeroulement.duree_clampage = Math.max(0, diff).toString();
          needsUpdate = true;
        }
      }

      // Fix Assistance Duration (Déclampage to Fin CEC)
      if (!deroulement.duree_assistance) {
        const start = findTime('Déclampage');
        const end = findTime('Fin CEC');
        if (start && end && isValid(start) && isValid(end)) {
          const diff = differenceInMinutes(end, start);
          newDeroulement.duree_assistance = Math.max(0, diff).toString();
          needsUpdate = true;
        }
      }

      if (needsUpdate) {
        try {
          await db.update(cecForms)
            .set({ deroulement: newDeroulement })
            .where(eq(cecForms.id, report.id));
          updatedCount++;
        } catch (e) {
          console.error(`Error updating report ${report.id}:`, e);
          errorCount++;
        }
      }
    }

    return { updated: updatedCount, errors: errorCount };
  } catch (error) {
    console.error("Critical error during duration repair:", error);
    throw error;
  }
}
