const resolveSearchScopeUserType = (scope) => {
  const normalizedScope = String(scope || 'all').trim().toLowerCase();
  if (normalizedScope === 'people') return 'employee';
  if (normalizedScope === 'companies') return 'company';
  return '';
};

const appendSearchScopeFilterClause = ({ values, scope }) => {
  const scopeUserType = resolveSearchScopeUserType(scope);
  if (!scopeUserType) {
    return '';
  }

  values.push(scopeUserType);
  return ` AND user_type = $${values.length}`;
};

module.exports = {
  resolveSearchScopeUserType,
  appendSearchScopeFilterClause,
};
