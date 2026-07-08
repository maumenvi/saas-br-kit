import type { CoreError, Result } from "../../../errors/result.ts";
import { applicationFailureFactory } from "../../shared/index.ts";

/**
 * Centralizes expected authentication failures returned by auth use cases.
 */
export class AuthFailures {
  /**
   * Compatibility facade for legacy static credential-failure calls.
   */
  static invalidCredentials(): Result<never, CoreError> {
    return authFailures.invalidCredentials();
  }

  /**
   * Compatibility facade for legacy static invalid-refresh-token calls.
   */
  static invalidRefreshToken(): Result<never, CoreError> {
    return authFailures.invalidRefreshToken();
  }

  /**
   * Compatibility facade for legacy static expired-refresh-token calls.
   */
  static expiredRefreshToken(): Result<never, CoreError> {
    return authFailures.expiredRefreshToken();
  }

  /**
   * Compatibility facade for legacy static refresh-token-reuse calls.
   */
  static refreshTokenReuseDetected(): Result<never, CoreError> {
    return authFailures.refreshTokenReuseDetected();
  }

  /**
   * Creates the failure returned when credentials cannot authenticate a user.
   */
  invalidCredentials(): Result<never, CoreError> {
    return applicationFailureFactory.authorization(
      "auth.invalid_credentials",
      "Email or password is invalid.",
    );
  }

  /**
   * Creates the failure returned when a refresh token cannot be found or used.
   */
  invalidRefreshToken(): Result<never, CoreError> {
    return applicationFailureFactory.authorization(
      "auth.refresh_token_invalid",
      "Refresh token is invalid.",
    );
  }

  /**
   * Creates the failure returned when a refresh token is past its expiration.
   */
  expiredRefreshToken(): Result<never, CoreError> {
    return applicationFailureFactory.authorization(
      "auth.refresh_token_expired",
      "Refresh token is expired.",
    );
  }

  /**
   * Creates the failure returned when refresh-token rotation detects reuse.
   */
  refreshTokenReuseDetected(): Result<never, CoreError> {
    return applicationFailureFactory.conflict(
      "auth.refresh_token_reuse_detected",
      "Refresh token reuse was detected.",
    );
  }
}

/** Shared authentication failure factory used by auth use cases. */
export const authFailures = new AuthFailures();
