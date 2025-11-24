import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ForumService } from '../../services';
import { ForumCategory, ForumTopic, Tag } from '../../models';

@Component({
  selector: 'app-forum-topic-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './forum-topic-list.component.html',
  styleUrls: ['./forum-topic-list.component.css'],
})
export class ForumTopicListComponent implements OnInit {
  category: ForumCategory | null = null;
  topics: ForumTopic[] = [];
  popularTags: Tag[] = [];
  loading = true;
  error: string | null = null;

  // Pagination
  currentPage = 1;
  totalPages = 1;
  totalTopics = 0;
  pageSize = 20;

  // Search
  searchQuery = '';

  constructor(
    private forumService: ForumService,
    private route: ActivatedRoute,
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe((params) => {
      const slug = params['slug'];
      if (slug) {
        this.loadCategory(slug);
        this.loadTopics(slug);
      }
    });

    this.loadPopularTags();
  }

  loadCategory(slug: string): void {
    this.forumService.getCategoryBySlug(slug).subscribe({
      next: (category) => {
        this.category = category;
      },
      error: (err) => {
        console.error('Error loading category:', err);
      },
    });
  }

  loadTopics(slug: string): void {
    if (!this.category) {
      // Wait for category to load first
      setTimeout(() => this.loadTopics(slug), 100);
      return;
    }

    this.loading = true;
    this.error = null;

    this.forumService
      .getTopicsByCategory(this.category.id, this.currentPage, this.pageSize)
      .subscribe({
        next: (response) => {
          this.topics = response.data;
          this.totalTopics = response.total;
          this.totalPages = Math.ceil(response.total / this.pageSize);
          this.loading = false;
        },
        error: (err) => {
          this.error = 'Failed to load topics';
          this.loading = false;
          console.error('Error loading topics:', err);
        },
      });
  }

  loadPopularTags(): void {
    this.forumService.getPopularTags(10).subscribe({
      next: (tags) => {
        this.popularTags = tags;
      },
      error: (err) => {
        console.error('Error loading tags:', err);
      },
    });
  }

  onSearch(): void {
    if (!this.searchQuery.trim()) {
      this.loadTopics(this.category!.slug);
      return;
    }

    this.loading = true;
    this.forumService
      .searchTopics(
        this.searchQuery,
        this.category?.id,
        undefined,
        this.currentPage,
        this.pageSize,
      )
      .subscribe({
        next: (response) => {
          this.topics = response.data;
          this.totalTopics = response.total;
          this.totalPages = Math.ceil(response.total / this.pageSize);
          this.loading = false;
        },
        error: (err) => {
          this.error = 'Failed to search topics';
          this.loading = false;
          console.error('Error searching topics:', err);
        },
      });
  }

  onPageChange(page: number): void {
    this.currentPage = page;
    window.scrollTo({ top: 0, behavior: 'smooth' });
    this.loadTopics(this.category!.slug);
  }

  formatNumber(num: number): string {
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    });
  }

  getPageNumbers(): number[] {
    const pages: number[] = [];
    const maxVisible = 5;
    let start = Math.max(1, this.currentPage - Math.floor(maxVisible / 2));
    let end = Math.min(this.totalPages, start + maxVisible - 1);

    if (end - start < maxVisible - 1) {
      start = Math.max(1, end - maxVisible + 1);
    }

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    return pages;
  }
}
