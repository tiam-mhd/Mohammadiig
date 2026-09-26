import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { SparePartCategoriesService } from "./spare-part-categories.service";
import { SparePartCategory } from "./spare-part-categories.types";
import { ManageCategoryDto } from "./dto/manage-category.dto";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { Roles } from "../auth/roles.decorator";
import { RolesGuard } from "../auth/roles.guard";

@ApiTags("spare-part-categories")
@Controller("spare-part-categories")
export class SparePartCategoriesController {
  constructor(private readonly categoriesService: SparePartCategoriesService) {}

  @Get()
  @ApiOperation({ summary: "List active spare-part categories" })
  findAll(
    @Query("page") rawPage = "1",
    @Query("limit") rawLimit = "20",
    @Query("q") q = "",
  ) {
    return this.categoriesService.findAll(Number(rawPage), Number(rawLimit), q);
  }

  @Get("admin/all")
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("admin")
  @ApiOperation({ summary: "List all spare-part categories for admin" })
  adminAll(
    @Query("page") rawPage = "1",
    @Query("limit") rawLimit = "20",
    @Query("q") q = "",
  ) {
    return this.categoriesService.findAllForAdmin(
      Number(rawPage),
      Number(rawLimit),
      q,
    );
  }

  @Post()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("admin")
  @ApiOperation({ summary: "Create spare-part category" })
  create(@Body() dto: ManageCategoryDto): Promise<SparePartCategory> {
    return this.categoriesService.create(dto);
  }

  @Patch(":id")
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("admin")
  @ApiOperation({ summary: "Update spare-part category" })
  update(
    @Param("id") id: string,
    @Body() dto: ManageCategoryDto,
  ): Promise<SparePartCategory> {
    return this.categoriesService.update(id, dto);
  }

  @Delete(":id")
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("admin")
  @ApiOperation({ summary: "Soft-delete spare-part category" })
  async remove(@Param("id") id: string): Promise<{ ok: true }> {
    await this.categoriesService.remove(id);
    return { ok: true };
  }
}
