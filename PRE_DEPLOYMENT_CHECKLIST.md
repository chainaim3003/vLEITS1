# Pre-Deployment Checklist

## ✅ Official GLEIF vLEI Implementation

Use this checklist before deploying to production.

---

## 📋 Code Implementation

- [x] Created `setup-vlei-official.command.ts` with official GLEIF flow
- [x] Added OOR_AUTH schema to `vlei-schemas.config.ts`
- [x] Added OOR_AUTH constant to `vlei.types.ts`
- [x] Updated CLI `index.ts` to include new command
- [x] Preserved original `setup-vlei.command.ts` for compatibility

## 📚 Documentation

- [x] Created `OFFICIAL_GLEIF_IMPLEMENTATION.md` (technical spec)
- [x] Created `MIGRATION_GUIDE.md` (upgrade guide)
- [x] Created `CREDENTIAL_FLOW_DIAGRAM.md` (visual diagrams)
- [x] Created `IMPLEMENTATION_SUMMARY.md` (quick reference)
- [x] Created `PRE_DEPLOYMENT_CHECKLIST.md` (this file)

## 🔧 Environment Setup

- [ ] vlei-server is running (check: `docker ps | grep vlei-server`)
- [ ] OOR_AUTH schema is loaded (check: `curl http://localhost:7723/oobi/EKA57bKBKxr_kN7iN5i7lMUxpMG-s19dRcmov1iDxz-E`)
- [ ] All required schemas are available:
  - [ ] QVI: `EBfdlu8R27Fbx-ehrqwImnK-8Cm79sqbAQ4MmvEAYqao`
  - [ ] LE: `ENPXp1vQzRF6JwIuS-mp2U8Uf1MoADoP_GqQ62VsDZWY`
  - [ ] OOR_AUTH: `EKA57bKBKxr_kN7iN5i7lMUxpMG-s19dRcmov1iDxz-E`
  - [ ] OOR: `EBNaNu-M9P5cgrnfl2Fvymy4E_jvxxyjb70PRtiANlJy`
  - [ ] ECR: `EEy9PkikFcANV1l7EHukCeXqrzT1hNZjGlUk7wuMO5jw`
- [ ] KERIA agents are running
- [ ] Network connectivity is working

## 🧪 Testing

### Basic Testing
- [ ] Run: `npm run cli clear`
- [ ] Run: `npm run cli setup-vlei-official`
- [ ] Verify: Command completes successfully
- [ ] Check: No errors in console output
- [ ] Run: `npm run cli list-identities`
- [ ] Verify: 7 identities created (ROOT, QVI, LE, 2 Persons, 2 Agents)
- [ ] Run: `npm run cli list-credentials`
- [ ] Verify: 9 credentials created

### Credential Verification
- [ ] QVI credential exists (ROOT → QVI)
- [ ] LE credential exists (QVI → LE)
- [ ] OOR_AUTH credentials exist (LE → Persons) **NEW**
- [ ] OOR credentials exist (QVI → Persons) **CHANGED ISSUER**
- [ ] ECR credentials exist (Persons → Agents)

### Edge Verification
- [ ] LE credential has edge to QVI credential
- [ ] OOR_AUTH credential has edge to LE credential
- [ ] OOR credential has edge to OOR_AUTH credential (edge name: "auth")
- [ ] ECR credential has edge to OOR credential

### Attribute Verification
- [ ] All credentials have required attributes
- [ ] OOR credentials include "dt" timestamp
- [ ] OOR_AUTH credentials include "AID" field
- [ ] All LEI fields are correct

## 📊 Registry Verification

- [ ] ROOT registry exists and contains QVI credential
- [ ] QVI registry exists and contains LE + OOR credentials
- [ ] LE registry exists and contains OOR_AUTH + ECR credentials

## 🔐 Trust Chain Verification

Verify the complete trust chain:

```
[ ] ROOT (trust anchor)
    └─► [ ] QVI Credential
            ├─► [ ] LE Credential (edge: qvi)
            │       └─► [ ] OOR_AUTH (edge: le) 🆕
            │
            └─► [ ] OOR Credential (edge: auth) 🆕
                    └─► [ ] ECR Credential (edge: oor)
```

## 🔄 Comparison with Previous Implementation

- [ ] Original `setup-vlei` command still works
- [ ] New `setup-vlei-official` command works correctly
- [ ] Both produce different credential chains (as expected)
- [ ] Documentation explains differences clearly

## 📝 Code Quality

- [ ] No TypeScript compilation errors
- [ ] No linting warnings
- [ ] Proper error handling in place
- [ ] Console output is clear and helpful
- [ ] Code follows existing patterns
- [ ] Comments are clear and accurate

## 🎯 GLEIF Compliance

- [ ] QVI issues OOR credentials (not LE) ✅
- [ ] OOR credentials stored in QVI registry ✅
- [ ] OOR has "auth" edge to OOR_AUTH ✅
- [ ] OOR_AUTH issued by LE ✅
- [ ] All required attributes present ✅
- [ ] Proper schema SAIDs used ✅
- [ ] Edge relationships correct ✅

## 🔍 Data Verification

Check the stored data files:

- [ ] `./data/identities.json` contains all identities
- [ ] `./data/credentials.json` contains all credentials
- [ ] `./data/registries.json` contains all registries
- [ ] `./data/oobis.json` contains all OOBI connections
- [ ] All files are valid JSON
- [ ] No duplicate entries
- [ ] All SAIDs are unique

## 🚀 Pre-Production

- [ ] Review all documentation
- [ ] Test with realistic data
- [ ] Verify timing/delays are appropriate
- [ ] Test error scenarios:
  - [ ] vlei-server down
  - [ ] Schema not found
  - [ ] Network issues
  - [ ] Credential admission timeout
- [ ] Performance is acceptable
- [ ] No memory leaks observed

## 📖 Documentation Review

- [ ] README explains both implementations
- [ ] Migration guide is clear
- [ ] Diagrams are accurate
- [ ] Examples are correct
- [ ] Troubleshooting section is helpful
- [ ] Links to external resources work

## 🔧 Configuration

- [ ] `config.json` has correct organization data
- [ ] Schema OOBIs point to correct server
- [ ] Network settings are correct for environment
- [ ] Timeouts are appropriate

## 🎓 Knowledge Transfer

- [ ] Team understands the difference between implementations
- [ ] Team knows when to use `setup-vlei` vs `setup-vlei-official`
- [ ] Team can troubleshoot common issues
- [ ] Team understands GLEIF compliance requirements
- [ ] Team has access to all documentation

## 🚦 Final Checks

- [ ] All tests pass
- [ ] All documentation is complete
- [ ] No known bugs
- [ ] Performance is acceptable
- [ ] Security review completed (if required)
- [ ] Backup plan in place
- [ ] Rollback procedure documented

## ✅ Deployment Approval

Once all items are checked:

- [ ] Code review approved
- [ ] Testing sign-off received
- [ ] Documentation approved
- [ ] Deployment plan reviewed
- [ ] Stakeholders notified

## 🎉 Post-Deployment

After deployment:

- [ ] Monitor for errors
- [ ] Verify production credentials
- [ ] Check performance metrics
- [ ] Gather user feedback
- [ ] Update documentation if needed

---

## 📊 Metrics to Track

After deployment, monitor:

- Success rate of credential issuance
- Average time for full chain setup
- Schema resolution success rate
- OOBI connection success rate
- Error rates and types
- Performance metrics

---

## 🆘 Rollback Plan

If issues occur:

1. Use `npm run cli clear` to clear data
2. Switch back to `setup-vlei` if needed
3. Document the issue
4. Review logs
5. Fix and redeploy

---

## 📞 Support Contacts

- Technical Lead: [Contact Info]
- KERIA Support: [Contact Info]
- GLEIF Documentation: https://www.gleif.org/vlei

---

**Checklist Version**: 1.0  
**Last Updated**: 2025-01-01  
**Next Review**: [Date]

---

## Sign-Off

- [ ] Developer: __________________ Date: _______
- [ ] Reviewer: ___________________ Date: _______
- [ ] QA: _________________________ Date: _______
- [ ] Product Owner: ______________ Date: _______

**Status**: ⬜ Ready for Deployment | ⬜ Needs Work | ⬜ Deployed

---

**Notes**:
