local claims = {
    email_verified: false,
} + std.extVar('claims');
  {
    identity: {
      traits: {
            [if 'email' in claims && claims.email_verified then 'email' else null
            ]: claims.email,
            [if "nickname" in claims then "name" else null
            ]: claims.nickname,
            [if "picture" in claims then "avatar" else null
            ]: claims.picture,
        },
        // Carry GitHub's verified status over, so Kratos does not mail a
        // verification code nobody can read (see kratos.yml.tmpl).
        verified_addresses: std.prune([
            if 'email' in claims && claims.email_verified then { via: 'email', value: claims.email },
        ]),
    },
}
