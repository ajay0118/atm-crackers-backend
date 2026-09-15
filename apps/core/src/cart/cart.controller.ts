import {
  Controller,
  Delete,
  Get,
  Headers,
  Param,
  Patch,
  Post,
  Body,
} from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CartService } from './cart.service';
import { AddCartItemDto } from './dto/add-cart-item.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';

@ApiTags('cart')
@Controller('cart')
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Post('items')
  @ApiOperation({ summary: 'Add a product to the cart' })
  @ApiResponse({
    status: 201,
    description: 'Product added to cart successfully',
  })
  addItem(@Headers('x-cart-key') key: string, @Body() dto: AddCartItemDto) {
    return this.cartService.addItem(key, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get the current cart' })
  getCart(@Headers('x-cart-key') key: string) {
    return this.cartService.getCart(key);
  }

  @Patch('items/:productId')
  @ApiOperation({ summary: 'Update cart item quantity' })
  @ApiParam({ name: 'productId' })
  updateItem(
    @Headers('x-cart-key') key: string,
    @Param('productId') productId: string,
    @Body() dto: UpdateCartItemDto,
  ) {
    return this.cartService.updateItem(key, productId, dto);
  }

  @Delete('items/:productId')
  @ApiOperation({ summary: 'Remove a product from the cart' })
  removeItem(
    @Headers('x-cart-key') key: string,
    @Param('productId') productId: string,
  ) {
    return this.cartService.removeItem(key, productId);
  }

  @Delete()
  @ApiOperation({ summary: 'Clear the cart' })
  clearCart(@Headers('x-cart-key') key: string) {
    return this.cartService.clearCart(key);
  }
}
