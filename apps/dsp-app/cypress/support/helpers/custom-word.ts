import { faker } from '@faker-js/faker';

export function generateKeyword(minLength: number) {
  let keyword = faker.lorem.word();
  while (keyword.length < minLength) {
    keyword = faker.lorem.word();
  }
  return keyword;
}
