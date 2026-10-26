import { IsIn, IsString, Matches, MaxLength, MinLength } from 'class-validator';

export class LookupVideoDto {
  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  url!: string;
}

export class CreateDownloadDto {
  @IsString()
  @Matches(/^[a-f0-9]{32}$/)
  lookupId!: string;

  @IsString()
  @IsIn(['source'])
  qualityId!: string;
}
