import _ from 'lodash';

export function getSlug(name) {
  return _.deburr(name)
    .replaceAll(/[^a-zA-Z0-9]/g, '')
    .toLowerCase();
}
