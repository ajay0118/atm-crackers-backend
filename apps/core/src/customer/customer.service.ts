import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Customer, CustomerAddress, CustomerDocument } from '@libs/contracts/customer/customer.schema';
import { CommonStatusType } from '@libs/contracts/enums/common.enum';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { CustomerAddressDto } from './dto/customer-address.dto';
import { UpdateAddressDto } from './dto/update-address.dto';

@Injectable()
export class CustomerService {
  constructor(@InjectModel(Customer.name) private readonly customerModel: Model<CustomerDocument>) {}

  private normalizeMobile(mobile: string): string {
    const normalized = mobile.replace(/\D/g, '');
    if (!/^[6-9]\d{9}$/.test(normalized)) throw new BadRequestException('Valid Indian mobile number is required');
    return normalized;
  }

  private findCustomer(mobile: string) {
    return this.customerModel.findOne({ normalizedMobile: this.normalizeMobile(mobile), status: CommonStatusType.ACTIVE }).exec();
  }

  private response(customer: CustomerDocument) {
    const addresses = customer.addresses as any[];
    return { id: customer._id.toString(), name: customer.name, mobile: customer.mobile, normalizedMobile: customer.normalizedMobile, email: customer.email ?? null, isPhoneVerified: customer.isPhoneVerified, status: customer.status, addresses: addresses.map((address) => ({ id: address._id.toString(), ...address.toObject() })) };
  }

  async createOrUpdate(dto: CreateCustomerDto) {
    const normalizedMobile = this.normalizeMobile(dto.mobile);
    let customer = await this.customerModel.findOne({ normalizedMobile }).exec();
    if (customer) {
      customer.name = dto.name.trim();
      customer.mobile = dto.mobile.trim();
      if (dto.email !== undefined) customer.email = dto.email.trim().toLowerCase();
      if (dto.address) this.addAddressToDocument(customer, dto.address);
    } else {
      customer = new this.customerModel({ name: dto.name.trim(), mobile: dto.mobile.trim(), normalizedMobile, email: dto.email?.trim().toLowerCase(), addresses: [] });
      if (dto.address) this.addAddressToDocument(customer, dto.address);
    }
    await customer.save();
    return { message: 'Customer saved successfully', data: this.response(customer) };
  }

  async getByMobile(mobile: string) {
    const customer = await this.findCustomer(mobile);
    if (!customer) throw new NotFoundException('Customer not found');
    return { message: 'Customer fetched successfully', data: this.response(customer) };
  }

  async updateByMobile(mobile: string, dto: UpdateCustomerDto) {
    const customer = await this.findCustomer(mobile);
    if (!customer) throw new NotFoundException('Customer not found');
    if (dto.name !== undefined) customer.name = dto.name.trim();
    if (dto.email !== undefined) customer.email = dto.email.trim().toLowerCase();
    if (dto.address) this.addAddressToDocument(customer, dto.address);
    await customer.save();
    return { message: 'Customer updated successfully', data: this.response(customer) };
  }

  async addAddress(mobile: string, dto: CustomerAddressDto) {
    const customer = await this.findCustomer(mobile);
    if (!customer) throw new NotFoundException('Customer not found');
    this.addAddressToDocument(customer, dto);
    await customer.save();
    return { message: 'Address added successfully', data: this.response(customer) };
  }

  async updateAddress(mobile: string, addressId: string, dto: UpdateAddressDto) {
    if (!Types.ObjectId.isValid(addressId)) throw new BadRequestException('Invalid address ID');
    const customer = await this.findCustomer(mobile);
    if (!customer) throw new NotFoundException('Customer not found');
    const address = (customer.addresses as any).id(addressId);
    if (!address) throw new NotFoundException('Address not found');
    Object.assign(address, dto);
    if (dto.isDefault) this.clearDefaultExcept(customer, address._id.toString());
    await customer.save();
    return { message: 'Address updated successfully', data: this.response(customer) };
  }

  async removeAddress(mobile: string, addressId: string) {
    if (!Types.ObjectId.isValid(addressId)) throw new BadRequestException('Invalid address ID');
    const customer = await this.findCustomer(mobile);
    if (!customer) throw new NotFoundException('Customer not found');
    const address = (customer.addresses as any).id(addressId);
    if (!address) throw new NotFoundException('Address not found');
    address.deleteOne();
    await customer.save();
    return { message: 'Address removed successfully', data: this.response(customer) };
  }

  private addAddressToDocument(customer: CustomerDocument, dto: CustomerAddressDto) {
    const addresses = customer.addresses as any;
    const address = addresses.create({ ...dto, state: dto.state ?? '', landmark: dto.landmark ?? '', isDefault: dto.isDefault ?? addresses.length === 0 });
    if (address.isDefault) this.clearDefaultExcept(customer, address._id.toString());
    addresses.push(address);
  }

  private clearDefaultExcept(customer: CustomerDocument, addressId: string) {
    for (const address of customer.addresses as any[]) address.isDefault = address._id.toString() === addressId;
  }
}
