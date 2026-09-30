import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Offer, OfferDocument } from '@libs/contracts/offer/offer.schema';
import {
  CommonStatusType,
  OfferScopeType,
} from '@libs/contracts/enums/common.enum';
import { CreateOfferDto } from './dto/create-offer.dto';
import { UpdateOfferDto } from './dto/update-offer.dto';
import { OfferListQueryDto } from './dto/offer-list-query.dto';

@Injectable()
export class AdminOfferService {
  constructor(
    @InjectModel(Offer.name) private readonly offerModel: Model<OfferDocument>,
  ) {}

  private normalize(dto: CreateOfferDto | UpdateOfferDto) {
    if (dto.startAt && dto.expiresAt && dto.expiresAt <= dto.startAt)
      throw new BadRequestException('Expiry must be after start date');
    const categoryIds =
      dto.scope === OfferScopeType.GLOBAL ? [] : dto.categoryIds;
    const productIds =
      dto.scope === OfferScopeType.GLOBAL ? [] : dto.productIds;
    if (
      dto.scope === OfferScopeType.GLOBAL &&
      ((categoryIds?.length ?? 0) > 0 || (productIds?.length ?? 0) > 0)
    )
      throw new BadRequestException(
        'Global offers cannot contain category or product IDs',
      );
    if (dto.scope === OfferScopeType.CATEGORY && !categoryIds?.length)
      throw new BadRequestException(
        'Category offers require at least one category ID',
      );
    if (dto.scope === OfferScopeType.PRODUCT && !productIds?.length)
      throw new BadRequestException(
        'Product offers require at least one product ID',
      );
    const data: Record<string, unknown> = { ...dto };
    data.categoryIds = categoryIds ?? [];
    data.productIds = productIds ?? [];
    return data;
  }

  private validateIds(ids: string[] | undefined) {
    for (const id of ids ?? [])
      if (!Types.ObjectId.isValid(id))
        throw new BadRequestException('Invalid category or product ID');
    return (ids ?? []).map((id) => new Types.ObjectId(id));
  }

  async create(dto: CreateOfferDto) {
    const data = this.normalize(dto);
    data.categoryIds = this.validateIds(dto.categoryIds);
    data.productIds = this.validateIds(dto.productIds);
    const offer = await this.offerModel.create(data);
    return { message: 'Offer created successfully', data: offer };
  }

  async findAll(query: OfferListQueryDto) {
    const filter: Record<string, unknown> = {};
    if (query.status) filter.status = query.status;
    if (query.scope) filter.scope = query.scope;
    if (query.search?.trim())
      filter.name = { $regex: query.search.trim(), $options: 'i' };
    const data = await this.offerModel
      .find(filter)
      .sort({ createdAt: -1 })
      .exec();
    return { message: 'Offers fetched successfully', count: data.length, data };
  }

  async findOne(id: string) {
    const data = await this.offerModel.findById(id).exec();
    if (!data) throw new NotFoundException('Offer not found');
    return { message: 'Offer fetched successfully', data };
  }

  async update(id: string, dto: UpdateOfferDto) {
    if (!Object.keys(dto).length)
      throw new BadRequestException('At least one offer field is required');
    const offer = await this.offerModel.findById(id).exec();
    if (!offer) throw new NotFoundException('Offer not found');
    const data = this.normalize({
      ...offer.toObject(),
      ...dto,
    } as CreateOfferDto);
    data.categoryIds = this.validateIds(
      dto.categoryIds ?? offer.categoryIds.map(String),
    );
    data.productIds = this.validateIds(
      dto.productIds ?? offer.productIds.map(String),
    );
    Object.assign(offer, data);
    await offer.save();
    return { message: 'Offer updated successfully', data: offer };
  }

  async remove(id: string) {
    const offer = await this.offerModel.findById(id).exec();
    if (!offer) throw new NotFoundException('Offer not found');
    await offer.deleteOne();
    return { message: 'Offer deleted successfully' };
  }
}
