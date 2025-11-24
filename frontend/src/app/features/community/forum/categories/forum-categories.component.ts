import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ForumService } from '../../services';
import { ForumCategory } from '../../models';

@Component({
  selector: 'app-forum-categories',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './forum-categories.component.html',
  styleUrls: ['./forum-categories.component.css'],
})
export class ForumCategoriesComponent implements OnInit {
  categories: ForumCategory[] = [];
  loading = true;
  error: string | null = null;

  constructor(private forumService: ForumService) {}

  ngOnInit(): void {
    this.loadCategories();
  }

  loadCategories(): void {
    this.loading = true;
    this.error = null;

    this.forumService.getAllCategories().subscribe({
      next: (categories) => {
        this.categories = categories;
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Failed to load forum categories';
        this.loading = false;
        console.error('Error loading categories:', err);
      },
    });
  }

  formatNumber(num: number): string {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  }
}
