import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ApiService } from '../services/api.service';

@Component({
  selector: 'app-infolesson',
  templateUrl: './infolesson.component.html',
})
export class InfolessonComponent implements OnInit {
  lessonId!: string;
  lessonDetails: any;
  users: any[] = [];

  constructor(private route: ActivatedRoute, private apiService: ApiService) {}

  ngOnInit(): void {
    this.lessonId = this.route.snapshot.paramMap.get('id')!;
    this.loadLessonDetails();
  }

  loadLessonDetails(): void {
    this.apiService.getUsersByLesson(this.lessonId).subscribe({
      next: (data: any) => {
        this.lessonDetails = data;
        const users = data.userSetHash;

        users.forEach((user: any) => {
          const userId = user.id;

          if (userId && (typeof userId === 'string' || typeof userId === 'number')) {
            this.apiService.getUserById(userId.toString()).subscribe({
              next: (userData: any) => {
                this.users.push(userData);
              }
            });
          }
        });
      }
    });
  }
}
