import { Component, OnInit } from '@angular/core';
import { ApiService } from '../services/api.service';
import { Router, ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-subject',
  templateUrl: './subject.component.html'
})
export class SubjectComponent implements OnInit {
  subjects: any[] = [];
  sortColumn = '';
  sortDirection = 'asc';
  formSubject: any = {
    id: 0,
    nrc: '',
    name: ''
  };

  selectedSubject: any = null;
  subjectInfo: any = null;
  subjectId: string | null = null;

  constructor(
    private apiService: ApiService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit() {
    this.getAllSubjects();
    this.subjectId = this.route.snapshot.paramMap.get('id');

    if (this.subjectId) {
      this.apiService.getSubjectById(this.subjectId).subscribe(
        (response) => {
          this.subjectInfo = response;
        },
        () => {}
      );
    }
  }

  getAllSubjects() {
    this.apiService.getAllSubjects().subscribe(
      (data: any[]) => {
        this.subjects = data;
      },
      () => {}
    );
  }

  onCreate() {
    this.apiService.createSubject(this.formSubject).subscribe(
      () => {
        this.getAllSubjects();
        this.router.navigate(['/subject']);
      },
      () => {}
    );
  }

  onEdit(subject: any) {
    this.selectedSubject = { ...subject };
    this.formSubject = { ...subject };
  }

  onUpdate(subject: any) {
    this.apiService.updateSubject(subject.id, subject).subscribe(
      () => {
        this.getAllSubjects();
        this.resetForm();
      },
      () => {}
    );
  }

  onDelete(subjectId: string) {
    this.apiService.deleteSubject(subjectId).subscribe(
      () => {
        this.getAllSubjects();
      },
      () => {}
    );
  }

  resetForm() {
    this.formSubject = {
      id: 0,
      nrc: '',
      name: ''
    };
    this.selectedSubject = null;
  }

  sortData() {
    if (this.sortColumn) {
      this.subjects.sort((a, b) => {
        if (a[this.sortColumn] < b[this.sortColumn]) {
          return this.sortDirection === 'asc' ? -1 : 1;
        } else if (a[this.sortColumn] > b[this.sortColumn]) {
          return this.sortDirection === 'asc' ? 1 : -1;
        } else {
          return 0;
        }
      });
    }
  }

  onSort(column: string) {
    if (this.sortColumn === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = column;
      this.sortDirection = 'asc';
    }
    this.sortData();
  }
}
