import { describe, it, expect } from "vitest";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import sqlite3 from "sqlite3";
import { open } from "sqlite";
import { initializeDB } from "../databaseInitializer";
import { generateMockData } from "../scripts/generateMockData";

describe("generateMockData", () => {
    it("seeds natural names and GitHub repo URLs", async () => {
        const tempDir = await mkdtemp(join(tmpdir(), "hgl-mockdata-"));
        const dbPath = join(tempDir, "mockdata.db");

        try {
            const dbInit = await initializeDB(dbPath, false);
            await dbInit.close();

            await generateMockData(dbPath, false);

            const db = await open({
                filename: dbPath,
                driver: sqlite3.Database,
            });

            try {
                const users = await db.all<
                        { name: string; email: string; githubUsername: string | null }[]
                >(
                        `SELECT name, email, githubUsername FROM users WHERE email IN (
                            'tarikul.islam@fau.de',
                            'ashraf.ullah@fau.de',
                            'sazid.rahaman@fau.de',
                            'kawser.hamid@fau.de'
                        ) ORDER BY email`
                );

                expect(users).toEqual([
                    {
                        name: "Ashraf Ullah",
                        email: "ashraf.ullah@fau.de",
                        githubUsername: "ashraf-amosso",
                    },
                    {
                        name: "Kawser Hamid",
                        email: "kawser.hamid@fau.de",
                        githubUsername: "kawser-adaptor",
                    },
                    {
                        name: "Sazid Rahaman",
                        email: "sazid.rahaman@fau.de",
                        githubUsername: "sazid-adap",
                    },
                    {
                        name: "Tarikul Islam",
                        email: "tarikul.islam@fau.de",
                        githubUsername: "tarikul-amos",
                    },
                ]);

                expect(users.some((u) => u.name.includes("Student"))).toBe(false);

                const memberships = await db.all<
                    { email: string; url: string | null }[]
                >(
                    `SELECT u.email as email, up.url as url
                     FROM user_projects up
                     JOIN users u ON u.id = up.userId
                     WHERE u.email IN (
                        'tarikul.islam@fau.de',
                        'ashraf.ullah@fau.de',
                        'sazid.rahaman@fau.de',
                        'kawser.hamid@fau.de'
                     )
                     ORDER BY u.email`
                );

                for (const membership of memberships) {
                    expect(membership.url).toMatch(/^https:\/\/github\.com\//);
                }

                const membershipMap = new Map(
                    memberships.map((m) => [m.email, m.url] as const)
                );

                expect(membershipMap.get("tarikul.islam@fau.de")).toBe(
                    "https://github.com/night-fury-me/digital-alchemy"
                );
                expect(membershipMap.get("ashraf.ullah@fau.de")).toBe(
                    "https://github.com/night-fury-me/advanced-data-engineering-fau"
                );
                expect(membershipMap.get("sazid.rahaman@fau.de")).toBe(
                    "https://github.com/night-fury-me/real-time-vehicle-data-processing"
                );
                expect(membershipMap.get("kawser.hamid@fau.de")).toBe(
                    "https://github.com/night-fury-me/happy-go-lucky"
                );
            } finally {
                await db.close();
            }
        } finally {
            await rm(tempDir, { recursive: true, force: true });
        }
    });
});
