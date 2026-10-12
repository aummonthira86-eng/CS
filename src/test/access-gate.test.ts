import { describe, expect, it, beforeEach } from "vitest";
import { authStore, calculateRole } from "@/lib/auth/auth-store";
import type { User } from "@supabase/supabase-js";

describe("Access Gate & Permission Control", () => {
  beforeEach(async () => {
    await authStore.signOut();
  });

  it("blocks unauthenticated users by default", () => {
    const state = authStore.getSnapshot();
    expect(state.user).toBeNull();
    expect(state.isApproved).toBe(false);
    expect(state.accessStatus).toBe("unauthenticated");
  });

  it("identifies owner accounts and automatically approves them", () => {
    authStore.loginAs("owner");
    const state = authStore.getSnapshot();
    expect(state.user).not.toBeNull();
    expect(state.role).toBe("owner");
    expect(state.isApproved).toBe(true);
    expect(state.accessStatus).toBe("approved");
  });

  it("blocks unapproved/new user until permission is granted", () => {
    authStore.loginAs("unapproved");
    const state = authStore.getSnapshot();
    expect(state.user).not.toBeNull();
    expect(state.isApproved).toBe(false);
    expect(state.accessStatus).toBe("pending");
    // Verify pending request was generated
    expect(state.pendingRequests.some((r) => r.email === "guest.waitlist@gaming-team.com")).toBe(
      true,
    );
  });

  it("allows owner to approve a pending user", () => {
    authStore.loginAs("unapproved");
    const userEmail = "guest.waitlist@gaming-team.com";
    expect(authStore.getSnapshot().isApproved).toBe(false);

    // Owner approves user as viewer
    authStore.approveUser(userEmail, "viewer", "Approved CS member");

    const approvedState = authStore.getSnapshot();
    expect(approvedState.isApproved).toBe(true);
    expect(approvedState.accessStatus).toBe("approved");
    expect(approvedState.role).toBe("viewer");
  });

  it("allows owner to pre-approve user email before they log in", () => {
    const newMemberEmail = "new.agent.nightshift@gaming-team.com";
    authStore.approveUser(newMemberEmail, "viewer", "Pre-approved by Admin");

    // Check whitelist contains user
    expect(authStore.getSnapshot().approvedUsers.some((u) => u.email === newMemberEmail)).toBe(
      true,
    );

    // Now user logs in with that email
    const mockUser: User = {
      id: "usr-nightshift-1",
      email: newMemberEmail,
      app_metadata: {},
      user_metadata: {},
      aud: "authenticated",
      created_at: new Date().toISOString(),
    };
    authStore.applyLoggedInUser(mockUser, null);

    const state = authStore.getSnapshot();
    expect(state.isApproved).toBe(true);
    expect(state.accessStatus).toBe("approved");
  });

  it("handles rejection and revoking of access", () => {
    authStore.loginAs("unapproved");
    const userEmail = "guest.waitlist@gaming-team.com";

    authStore.rejectUser(userEmail);
    const state = authStore.getSnapshot();
    expect(state.isApproved).toBe(false);
    expect(state.accessStatus).toBe("rejected");
  });
});
