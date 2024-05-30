import { BadRequestException } from '@nestjs/common';

export function parseSort(
  sort: string,
  allowedProperties: string[],
): Record<string, 'asc' | 'desc'> {
  const sortArray = sort.split(',');
  const sortObject: Record<string, 'asc' | 'desc'> = {};

  for (const sortItem of sortArray) {
    const order = sortItem.startsWith('-') ? 'desc' : 'asc';
    const property = sortItem.replace(/^-/, '');
    if (!allowedProperties.includes(property)) {
      throw new BadRequestException({
        message: 'Invalid sort property',
        errors: { sort: `Invalid sort property ${property}` },
      });
    }
    sortObject[property] = order;
  }

  return sortObject;
}

export function mockparseSort(
  sort: string,
  allowedProperties: string[],
): Record<string, 'asc' | 'desc'> {
  const sortArray = sort.split(',');
  const sortObject: Record<string, 'asc' | 'desc'> = {};

  for (const sortItem of sortArray) {
    const order = sortItem.startsWith('-') ? 'desc' : 'asc';
    const property = sortItem.replace(/^-/, '');

    if (allowedProperties.includes(property)) {
      sortObject[property] = order;
    }
  }

  return sortObject;
}